import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Upload, Mic, Image, ArrowLeft, Headphones } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { UploadResult } from "@uppy/core";

const podcastFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  episodeNumber: z.coerce.number().int().positive().optional(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  duration: z.string().optional(),
  hostName: z.string().optional(),
  guestName: z.string().optional(),
  guestTitle: z.string().optional(),
});

type PodcastFormData = z.infer<typeof podcastFormSchema>;

export default function AddPodcast() {
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const podcastForm = useForm<PodcastFormData>({
    resolver: zodResolver(podcastFormSchema),
    defaultValues: {
      title: "",
      description: "",
      episodeNumber: undefined,
      audioUrl: "",
      imageUrl: "",
      duration: "",
      hostName: "",
      guestName: "",
      guestTitle: "",
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
      setTimeout(() => setLocation("/podcasts"), 1500);
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

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("/api/upload-parameters", "GET");
    return response as { method: "PUT"; url: string };
  };

  const handleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        setUploadingImage(true);
        const response = await apiRequest("/api/articles/images", "PUT", {
          imageURL: uploadURL,
        }) as { objectPath: string };
        podcastForm.setValue("imageUrl", response.objectPath);
        toast({
          title: "Success",
          description: "Episode image uploaded successfully!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process uploaded image.",
          variant: "destructive",
        });
        console.error("Error processing image upload:", error);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const onSubmitPodcast = (data: PodcastFormData) => {
    createPodcastMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link href="/podcasts">
              <Button variant="ghost" className="flex items-center gap-2 mb-4" data-testid="button-back-to-podcasts">
                <ArrowLeft className="h-4 w-4" />
                Back to Podcasts
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-add-podcast-title">
              Create Podcast Episode
            </h1>
            <p className="text-gray-600 dark:text-gray-300" data-testid="text-add-podcast-description">
              Add a new episode to the Digital Ledger podcast hub.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="text-podcast-form-title">
                <Headphones className="h-5 w-5" />
                Episode Details
              </CardTitle>
              <CardDescription data-testid="text-podcast-form-description">
                Fill in the details below to publish a new podcast episode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...podcastForm}>
                <form onSubmit={podcastForm.handleSubmit(onSubmitPodcast)} className="space-y-6">
                  <FormField
                    control={podcastForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Episode summary and key topics discussed..." 
                            className="resize-none" 
                            rows={6}
                            {...field}
                            value={field.value || ''}
                            data-testid="input-podcast-description"
                          />
                        </FormControl>
                        <FormDescription>
                          A detailed description of the episode content.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={podcastForm.control}
                      name="episodeNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode Number (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 42" 
                              {...field}
                              value={field.value ?? ''}
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
                          <FormLabel>Duration (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 45 (minutes)" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-podcast-duration"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Duration in minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={podcastForm.control}
                    name="audioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="url" 
                            placeholder="https://example.com/episode.mp3" 
                            {...field}
                            value={field.value || ''}
                            data-testid="input-podcast-audio-url"
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the audio file hosted on your platform (Spotify, Apple Podcasts, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-6 space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      Host & Guest Information
                    </h3>

                    <FormField
                      control={podcastForm.control}
                      name="hostName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host Name (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., John Smith" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-podcast-host-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={podcastForm.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guest Name (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Jane Doe" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-podcast-guest-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={podcastForm.control}
                        name="guestTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guest Title (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., CPA, CFO at Acme Corp" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-podcast-guest-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Episode Cover Image</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Upload an image for the episode (Max 5MB).
                        </p>
                      </div>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleImageUpload}
                        buttonClassName="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        {uploadingImage ? "Processing..." : "Upload Image"}
                      </ObjectUploader>
                    </div>
                    {podcastForm.watch("imageUrl") && (
                      <Badge variant="secondary" className="text-xs" data-testid="badge-podcast-image-uploaded">
                        Image uploaded successfully
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Link href="/podcasts">
                      <Button 
                        type="button"
                        variant="outline"
                        data-testid="button-cancel-podcast"
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button 
                      type="submit" 
                      disabled={createPodcastMutation.isPending}
                      className="flex items-center gap-2"
                      data-testid="button-create-podcast"
                    >
                      <Upload className="h-4 w-4" />
                      {createPodcastMutation.isPending ? "Creating..." : "Publish Episode"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
