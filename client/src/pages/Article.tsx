import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, ExternalLink, Heart, MessageCircle, Share2, Edit, Trash2, Archive, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { insertNewsArticleSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

type ArticleFormData = {
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  category: string;
};

export default function Article() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useLocation();

  const articleForm = useForm<ArticleFormData>({
    resolver: zodResolver(insertNewsArticleSchema.pick({
      title: true,
      content: true,
      excerpt: true,
      imageUrl: true,
      thumbnailUrl: true,
      sourceUrl: true,
      sourceName: true,
      category: true,
    })),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      thumbnailUrl: "",
      sourceUrl: "",
      sourceName: "",
      category: "",
    },
  });

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['/api/news', id],
    queryFn: async () => {
      const response = await fetch(`/api/news/${id}`);
      if (!response.ok) {
        throw new Error('Article not found');
      }
      return response.json();
    },
    enabled: !!id,
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      return apiRequest(`/api/news/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/news', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      setIsEditing(false);
      toast({
        title: "Article updated",
        description: "The article has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update the article. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/news/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
      setLocation("/news"); // Redirect to news page
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  // Archive article mutation
  const archiveArticleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/news/${id}/archive`, "PATCH");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({
        title: "Success",
        description: "Article archived successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive article",
        variant: "destructive",
      });
    },
  });

  const handleEditArticle = () => {
    if (article) {
      articleForm.reset({
        title: article.title || "",
        content: article.content || "",
        excerpt: article.excerpt || "",
        imageUrl: article.imageUrl || "",
        thumbnailUrl: article.thumbnailUrl || "",
        sourceUrl: article.sourceUrl || "",
        sourceName: article.sourceName || "",
        category: article.category || "",
      });
      setIsEditing(true);
    }
  };

  const onSubmitArticle = (data: ArticleFormData) => {
    updateArticleMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Skeleton className="h-10 w-32 mb-4" />
            </div>
            
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/2 mb-6" />
                <Skeleton className="h-64 w-full mb-6 rounded-lg" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/news">
              <Button variant="ghost" className="mb-6" data-testid="button-back-to-news">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </Link>
            
            <Card>
              <CardContent className="p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Article Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  The article you're looking for doesn't exist or may have been removed.
                </p>
                <Link href="/news">
                  <Button>Browse All Articles</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/news">
              <Button variant="ghost" data-testid="button-back-to-news">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to News
              </Button>
            </Link>
            
            {(user as any)?.role === 'admin' && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleEditArticle}
                  data-testid="button-edit-article"
                >
                  <Edit className="h-4 w-4" />
                  Edit Article
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => archiveArticleMutation.mutate()}
                  disabled={archiveArticleMutation.isPending}
                  data-testid="button-archive-article"
                >
                  <Archive className="h-4 w-4" />
                  {archiveArticleMutation.isPending ? "Archiving..." : "Archive"}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex items-center gap-2"
                      data-testid="button-delete-article"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Article</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this article? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteArticleMutation.mutate()}
                        disabled={deleteArticleMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-confirm-delete"
                      >
                        {deleteArticleMutation.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          
          <Card>
            <CardContent className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="capitalize" data-testid="article-category">
                    {article.category?.replace('-', ' ') || 'General'}
                  </Badge>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span data-testid="article-date">
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight" data-testid="article-title">
                  {article.title}
                </h1>
                
                {article.excerpt && (
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed" data-testid="article-excerpt">
                    {article.excerpt}
                  </p>
                )}
              </div>

              <div className="mb-8">
                <img 
                  src={article.imageUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&q=80"}
                  alt={article.title}
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                  data-testid="article-image"
                  onError={(e) => {
                    // Fallback to default image if the uploaded image fails to load
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&q=80";
                  }}
                />
              </div>

              <div className="prose prose-lg max-w-none dark:prose-invert mb-8" data-testid="article-content">
                {article.content ? (
                  <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">
                    No content available for this article.
                  </p>
                )}
              </div>

              {article.sourceName && article.sourceUrl && (
                <div className="border-t pt-6 mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Original Source:
                  </p>
                  <a 
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 dark:text-ai-teal dark:hover:text-ai-teal/80 transition-colors"
                    data-testid="article-source-link"
                  >
                    <span className="font-medium">{article.sourceName}</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <Heart className="h-5 w-5" />
                    <span data-testid="article-likes">{article.likes || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="h-5 w-5" />
                    <span>0 comments</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Edit Article Dialog */}
          {isEditing && (
            <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Article</DialogTitle>
                  <DialogDescription>
                    Update the article content and information
                  </DialogDescription>
                </DialogHeader>
                <Form {...articleForm}>
                  <form onSubmit={articleForm.handleSubmit(onSubmitArticle)} className="space-y-6">
                    <FormField
                      control={articleForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter article title..." {...field} data-testid="input-edit-title" />
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
                              data-testid="input-edit-excerpt"
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
                              placeholder="Write the full article content here..." 
                              className="resize-none min-h-[200px]" 
                              {...field}
                              data-testid="input-edit-content"
                            />
                          </FormControl>
                          <FormDescription>
                            The main content of the article. Line breaks will be preserved.
                          </FormDescription>
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
                                <SelectTrigger data-testid="select-edit-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="automation">Automation</SelectItem>
                                <SelectItem value="fraud-detection">Fraud Detection</SelectItem>
                                <SelectItem value="regulatory">Regulatory</SelectItem>
                                <SelectItem value="generative-ai">Generative AI</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Image Upload Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Main Article Image */}
                      <FormField
                        control={articleForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Main Article Image</FormLabel>
                            <div className="space-y-4">
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={5242880} // 5MB limit for images
                                onGetUploadParameters={async () => {
                                  const response = await apiRequest("/api/objects/upload", "POST");
                                  return {
                                    method: "PUT" as const,
                                    url: response.uploadURL,
                                  };
                                }}
                                onComplete={async (result) => {
                                  if (result.successful && result.successful.length > 0) {
                                    const uploadedFile = result.successful[0];
                                    const imageURL = uploadedFile.response?.body?.url;
                                    
                                    if (imageURL) {
                                      try {
                                        const aclResponse = await apiRequest("/api/articles/images", "PUT", {
                                          imageURL: imageURL
                                        });
                                        
                                        const publicURL = `/public-objects${aclResponse.objectPath}`;
                                        field.onChange(publicURL);
                                        
                                        toast({
                                          title: "Success",
                                          description: "Main image uploaded successfully!",
                                        });
                                      } catch (error) {
                                        console.error("Error setting image ACL:", error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to process main image",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }
                                }}
                                buttonClassName="w-full"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Main Image
                              </ObjectUploader>

                              <div className="relative">
                                <p className="text-sm text-gray-500 mb-2">Or enter URL:</p>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/main-image.jpg" 
                                    {...field}
                                    value={field.value || ''}
                                    data-testid="input-edit-main-image"
                                  />
                                </FormControl>
                              </div>

                              {field.value && (
                                <div className="border rounded-lg p-4">
                                  <p className="text-sm text-gray-500 mb-2">Current Main Image:</p>
                                  <img 
                                    src={field.value} 
                                    alt="Main article preview" 
                                    className="w-full h-32 object-cover rounded-md"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <p className="text-xs text-gray-400 mt-1 break-all">{field.value}</p>
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Thumbnail Image */}
                      <FormField
                        control={articleForm.control}
                        name="thumbnailUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thumbnail Image</FormLabel>
                            <div className="space-y-4">
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={2097152} // 2MB limit for thumbnails
                                onGetUploadParameters={async () => {
                                  const response = await apiRequest("/api/objects/upload", "POST");
                                  return {
                                    method: "PUT" as const,
                                    url: response.uploadURL,
                                  };
                                }}
                                onComplete={async (result) => {
                                  if (result.successful && result.successful.length > 0) {
                                    const uploadedFile = result.successful[0];
                                    const imageURL = uploadedFile.response?.body?.url;
                                    
                                    if (imageURL) {
                                      try {
                                        const aclResponse = await apiRequest("/api/articles/images", "PUT", {
                                          imageURL: imageURL
                                        });
                                        
                                        const publicURL = `/public-objects${aclResponse.objectPath}`;
                                        field.onChange(publicURL);
                                        
                                        toast({
                                          title: "Success",
                                          description: "Thumbnail uploaded successfully!",
                                        });
                                      } catch (error) {
                                        console.error("Error setting thumbnail ACL:", error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to process thumbnail",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }
                                }}
                                buttonClassName="w-full"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Thumbnail
                              </ObjectUploader>

                              <div className="relative">
                                <p className="text-sm text-gray-500 mb-2">Or enter URL:</p>
                                <FormControl>
                                  <Input 
                                    placeholder="https://example.com/thumbnail.jpg" 
                                    {...field}
                                    value={field.value || ''}
                                    data-testid="input-edit-thumbnail"
                                  />
                                </FormControl>
                              </div>

                              {field.value && (
                                <div className="border rounded-lg p-4">
                                  <p className="text-sm text-gray-500 mb-2">Current Thumbnail:</p>
                                  <img 
                                    src={field.value} 
                                    alt="Thumbnail preview" 
                                    className="w-full h-20 object-cover rounded-md"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <p className="text-xs text-gray-400 mt-1 break-all">{field.value}</p>
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={articleForm.control}
                        name="sourceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Name (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. TechCrunch, Forbes" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-edit-source-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={articleForm.control}
                        name="sourceUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source URL (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/original-article" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-edit-source-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateArticleMutation.isPending}
                        data-testid="button-save-edit"
                      >
                        {updateArticleMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}