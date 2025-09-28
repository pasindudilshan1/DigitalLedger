import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { insertNewsArticleSchema, insertPodcastEpisodeSchema, insertUserInvitationSchema } from "@shared/schema";
import { z } from "zod";
import { Upload, FileText, Mic, Image, AudioWaveform, Users, UserPlus, Shield, ShieldCheck } from "lucide-react";
import type { UploadResult } from "@uppy/core";

// Extended schemas for form validation
const articleFormSchema = insertNewsArticleSchema.extend({
  imageFile: z.string().optional(),
}).partial();

const podcastFormSchema = insertPodcastEpisodeSchema.extend({
  audioFile: z.string().optional(),
  coverImageFile: z.string().optional(),
}).partial();

const inviteFormSchema = insertUserInvitationSchema.pick({
  email: true,
  role: true,
});

type ArticleFormData = z.infer<typeof articleFormSchema>;
type PodcastFormData = z.infer<typeof podcastFormSchema>;
type InviteFormData = z.infer<typeof inviteFormSchema>;

const newsCategories = [
  { value: "automation", label: "Automation" },
  { value: "fraud-detection", label: "Fraud Detection" },
  { value: "regulatory", label: "Regulatory" },
  { value: "generative-ai", label: "Generative AI" },
];

export default function Admin() {
  const [uploadingArticleImage, setUploadingArticleImage] = useState(false);
  const [uploadingPodcastAudio, setUploadingPodcastAudio] = useState(false);
  const [uploadingPodcastImage, setUploadingPodcastImage] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const articleForm = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      category: "",
      sourceUrl: "",
      sourceName: "",
      imageUrl: "",
    },
  });

  const podcastForm = useForm<PodcastFormData>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      title: "",
      description: "",
      episodeNumber: 1,
      hostName: "",
      guestName: "",
      guestTitle: "",
      duration: "",
      audioUrl: "",
      imageUrl: "",
    },
  });

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      return await apiRequest("/api/news", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      articleForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating article:", error);
    },
  });

  const createPodcastMutation = useMutation({
    mutationFn: async (data: PodcastFormData) => {
      return await apiRequest("/api/podcasts", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Podcast episode created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      podcastForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create podcast episode. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating podcast:", error);
    },
  });

  // User management queries
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<any[]>({
    queryKey: ["/api/users/invitations"],
  });

  // User management mutations
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      return await apiRequest("/api/users/invite", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User invitation sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/invitations"] });
      inviteForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating invitation:", error);
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/api/users/${userId}/role`, "PATCH", { role });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
      console.error("Error updating role:", error);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return await apiRequest(`/api/users/${userId}/status`, "PATCH", { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
      console.error("Error updating status:", error);
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest(`/api/users/invitations/${invitationId}/revoke`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation revoked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/invitations"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to revoke invitation.",
        variant: "destructive",
      });
      console.error("Error revoking invitation:", error);
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("/api/objects/upload", "POST") as { uploadURL: string };
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleArticleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        setUploadingArticleImage(true);
        const response = await apiRequest("/api/articles/images", "PUT", {
          imageURL: uploadURL,
        }) as { objectPath: string };
        articleForm.setValue("imageUrl", response.objectPath);
        toast({
          title: "Success",
          description: "Article image uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded image.",
          variant: "destructive",
        });
        console.error("Error processing image upload:", error);
      } finally {
        setUploadingArticleImage(false);
      }
    }
  };

  const handlePodcastAudioUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        setUploadingPodcastAudio(true);
        const response = await apiRequest("/api/podcasts/audio", "PUT", {
          audioURL: uploadURL,
        }) as { objectPath: string };
        podcastForm.setValue("audioUrl", response.objectPath);
        toast({
          title: "Success",
          description: "Podcast audio uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded audio.",
          variant: "destructive",
        });
        console.error("Error processing audio upload:", error);
      } finally {
        setUploadingPodcastAudio(false);
      }
    }
  };

  const handlePodcastImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        setUploadingPodcastImage(true);
        const response = await apiRequest("/api/articles/images", "PUT", {
          imageURL: uploadURL,
        }) as { objectPath: string };
        podcastForm.setValue("imageUrl", response.objectPath);
        toast({
          title: "Success",
          description: "Podcast cover image uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded image.",
          variant: "destructive",
        });
        console.error("Error processing image upload:", error);
      } finally {
        setUploadingPodcastImage(false);
      }
    }
  };

  const onSubmitArticle = (data: ArticleFormData) => {
    createArticleMutation.mutate(data);
  };

  const onSubmitPodcast = (data: PodcastFormData) => {
    createPodcastMutation.mutate(data);
  };

  const onSubmitInvite = (data: InviteFormData) => {
    createInvitationMutation.mutate(data);
  };

  const handleRoleChange = (userId: string, role: string) => {
    changeRoleMutation.mutate({ userId, role });
  };

  const handleStatusToggle = (userId: string, isActive: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive });
  };

  const handleRevokeInvitation = (invitationId: string) => {
    revokeInvitationMutation.mutate(invitationId);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-admin-title">
            Content Control Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-300" data-testid="text-admin-description">
            Create and manage articles and podcast episodes for the Digital Ledger community.
          </p>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="articles" className="flex items-center gap-2" data-testid="tab-articles">
              <FileText className="h-4 w-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="podcasts" className="flex items-center gap-2" data-testid="tab-podcasts">
              <Mic className="h-4 w-4" />
              Podcasts
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-article-form-title">
                  <FileText className="h-5 w-5" />
                  Create New Article
                </CardTitle>
                <CardDescription data-testid="text-article-form-description">
                  Add a new article to the news feed. Articles help keep the community updated on AI developments in accounting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...articleForm}>
                  <form onSubmit={articleForm.handleSubmit(onSubmitArticle)} className="space-y-6">
                    <FormField
                      control={articleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter article title..." {...field} data-testid="input-article-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Excerpt</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief summary of the article..." 
                              className="resize-none" 
                              rows={3}
                              {...field}
                              value={field.value || ''}
                              data-testid="input-article-excerpt"
                            />
                          </FormControl>
                          <FormDescription>
                            A short summary that will appear in the article preview.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={articleForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write the full article content..." 
                              className="resize-none" 
                              rows={10}
                              {...field} 
                              data-testid="input-article-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={articleForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-article-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {newsCategories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={articleForm.control}
                        name="sourceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., TechCrunch, Forbes..." {...field} value={field.value || ''} data-testid="input-article-source-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={articleForm.control}
                      name="sourceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source URL</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://example.com/original-article" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-article-source-url"
                            />
                          </FormControl>
                          <FormDescription>
                            Link to the original article (if applicable).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium">Featured Image</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Upload an image to accompany your article.
                          </p>
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handleArticleImageUpload}
                          buttonClassName="flex items-center gap-2"
                        >
                          <Image className="h-4 w-4" />
                          {uploadingArticleImage ? "Processing..." : "Upload Image"}
                        </ObjectUploader>
                      </div>
                      {articleForm.watch("imageUrl") && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-article-image-uploaded">
                          Image uploaded successfully
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={createArticleMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-create-article"
                      >
                        <Upload className="h-4 w-4" />
                        {createArticleMutation.isPending ? "Creating..." : "Create Article"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="podcasts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-podcast-form-title">
                  <Mic className="h-5 w-5" />
                  Create New Podcast Episode
                </CardTitle>
                <CardDescription data-testid="text-podcast-form-description">
                  Add a new podcast episode to the hub. Share expert insights and discussions about AI in accounting.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...podcastForm}>
                  <form onSubmit={podcastForm.handleSubmit(onSubmitPodcast)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={podcastForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Episode Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter episode title..." {...field} data-testid="input-podcast-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={podcastForm.control}
                        name="episodeNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Episode Number</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-podcast-episode-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={podcastForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 45:30" {...field} value={field.value || ''} data-testid="input-podcast-duration" />
                            </FormControl>
                            <FormDescription>
                              Format: MM:SS or HH:MM:SS
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={podcastForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what this episode covers..." 
                              className="resize-none" 
                              rows={4}
                              {...field}
                              value={field.value || ''}
                              data-testid="input-podcast-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={podcastForm.control}
                        name="hostName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Host Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Host's name" {...field} value={field.value || ''} data-testid="input-podcast-host" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={podcastForm.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guest Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Guest's name (optional)" {...field} value={field.value || ''} data-testid="input-podcast-guest" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={podcastForm.control}
                      name="guestTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Guest's professional title (optional)" {...field} value={field.value || ''} data-testid="input-podcast-guest-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium">Audio File</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Upload the podcast audio file (MP3, WAV, etc.).
                          </p>
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={104857600} // 100MB
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handlePodcastAudioUpload}
                          buttonClassName="flex items-center gap-2"
                        >
                          <AudioWaveform className="h-4 w-4" />
                          {uploadingPodcastAudio ? "Processing..." : "Upload Audio"}
                        </ObjectUploader>
                      </div>
                      {podcastForm.watch("audioUrl") && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-podcast-audio-uploaded">
                          Audio uploaded successfully
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium">Cover Image</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Upload a cover image for the episode.
                          </p>
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={handlePodcastImageUpload}
                          buttonClassName="flex items-center gap-2"
                        >
                          <Image className="h-4 w-4" />
                          {uploadingPodcastImage ? "Processing..." : "Upload Cover"}
                        </ObjectUploader>
                      </div>
                      {podcastForm.watch("imageUrl") && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-podcast-image-uploaded">
                          Cover image uploaded successfully
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={createPodcastMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-create-podcast"
                      >
                        <Upload className="h-4 w-4" />
                        {createPodcastMutation.isPending ? "Creating..." : "Create Episode"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              {/* Invite Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-invite-form-title">
                    <UserPlus className="h-5 w-5" />
                    Invite New User
                  </CardTitle>
                  <CardDescription data-testid="text-invite-form-description">
                    Send an invitation to add a new user to the Digital Ledger community.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...inviteForm}>
                    <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={inviteForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="user@example.com" 
                                  {...field} 
                                  data-testid="input-invite-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={inviteForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-invite-role">
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={createInvitationMutation.isPending}
                          className="flex items-center gap-2"
                          data-testid="button-send-invite"
                        >
                          <UserPlus className="h-4 w-4" />
                          {createInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Current Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-users-table-title">
                    <Users className="h-5 w-5" />
                    Current Users
                  </CardTitle>
                  <CardDescription data-testid="text-users-table-description">
                    Manage existing users, their roles, and account status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-4" data-testid="loading-users">Loading users...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user: any) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell data-testid={`text-user-name-${user.id}`}>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell data-testid={`text-user-email-${user.id}`}>
                              {user.email}
                            </TableCell>
                            <TableCell data-testid={`text-user-role-${user.id}`}>
                              <Badge variant={user.role === 'admin' ? 'default' : user.role === 'moderator' ? 'secondary' : 'outline'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-user-status-${user.id}`}>
                              <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      data-testid={`button-change-role-${user.id}`}
                                    >
                                      <Shield className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Change User Role</DialogTitle>
                                      <DialogDescription>
                                        Update the role for {user.firstName} {user.lastName} ({user.email})
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <Select 
                                        defaultValue={user.role}
                                        onValueChange={(role) => handleRoleChange(user.id, role)}
                                      >
                                        <SelectTrigger data-testid={`select-user-role-${user.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="member">Member</SelectItem>
                                          <SelectItem value="moderator">Moderator</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button
                                  variant={user.isActive ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => handleStatusToggle(user.id, !user.isActive)}
                                  disabled={toggleUserStatusMutation.isPending}
                                  data-testid={`button-toggle-status-${user.id}`}
                                >
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {users.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4" data-testid="empty-users">
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-invitations-table-title">
                    <UserPlus className="h-5 w-5" />
                    Pending Invitations
                  </CardTitle>
                  <CardDescription data-testid="text-invitations-table-description">
                    View and manage pending user invitations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invitationsLoading ? (
                    <div className="text-center py-4" data-testid="loading-invitations">Loading invitations...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Invited On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((invitation: any) => (
                          <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                            <TableCell data-testid={`text-invitation-email-${invitation.id}`}>
                              {invitation.email}
                            </TableCell>
                            <TableCell data-testid={`text-invitation-role-${invitation.id}`}>
                              <Badge variant={invitation.role === 'admin' ? 'default' : invitation.role === 'moderator' ? 'secondary' : 'outline'}>
                                {invitation.role}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-invitation-date-${invitation.id}`}>
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                disabled={revokeInvitationMutation.isPending}
                                data-testid={`button-revoke-invitation-${invitation.id}`}
                              >
                                Revoke
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {invitations.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4" data-testid="empty-invitations">
                              No pending invitations.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}