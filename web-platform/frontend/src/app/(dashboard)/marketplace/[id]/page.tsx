"use client";

import { useState, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { templatesApi } from "@/lib/api";
import {
  ArrowLeft,
  Download,
  Star,
  Heart,
  Users,
  Layers,
  GitBranch,
  Loader2,
  Tag,
  Key,
  Wrench,
  Check,
  Info,
  Code,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  long_description?: string;
  template_type: string;
  category?: {
    id: string;
    name: string;
  };
  content: any;
  preview_image?: string;
  screenshots: string[];
  author_id: string;
  author_name?: string;
  downloads: number;
  likes: number;
  rating: number;
  rating_count: number;
  is_free: boolean;
  price: number;
  is_featured: boolean;
  is_verified: boolean;
  version: string;
  tags: string[];
  use_cases: string[];
  required_tools: string[];
  required_api_keys: string[];
  created_at: string;
  updated_at: string;
  reviews?: Review[];
}

const typeIcons = {
  crew: Layers,
  flow: GitBranch,
  agent: Users,
};

// Memoized Review Item component
const ReviewItem = memo(function ReviewItem({ review }: { review: Review }) {
  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{review.user_name}</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= review.rating
                        ? "text-yellow-500 fill-current"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {review.helpful_count > 0 && (
          <Badge variant="secondary" className="text-xs">
            {review.helpful_count} found helpful
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground ml-13 pl-13">
        {review.comment}
      </p>
    </div>
  );
});

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params.id as string;

  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [localReviews, setLocalReviews] = useState<Review[]>([]);

  // Fetch template with react-query
  const { data: template, isLoading, error } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const response = await templatesApi.get(templateId);
      return response.data as Template;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Mock reviews (would come from API in production)
  const reviews = template?.reviews || localReviews.length > 0 ? [...localReviews, ...(template?.reviews || [])] : [
    {
      id: "1",
      user_id: "user1",
      user_name: "John D.",
      rating: 5,
      comment: "Excellent template! Saved me hours of work setting up my crew.",
      created_at: "2024-01-10T10:30:00Z",
      helpful_count: 12,
    },
    {
      id: "2",
      user_id: "user2",
      user_name: "Sarah M.",
      rating: 4,
      comment: "Great starting point for my project. Had to make a few tweaks but overall very useful.",
      created_at: "2024-01-08T15:45:00Z",
      helpful_count: 8,
    },
  ];

  // Use template mutation
  const useMutation_ = useMutation({
    mutationFn: async () => {
      const response = await templatesApi.use(templateId);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.type === "crew") {
        router.push(`/crews/${data.id}/edit`);
      } else if (data.type === "flow") {
        router.push(`/flows/${data.id}/edit`);
      } else if (data.type === "agent") {
        router.push(`/agents/${data.id}`);
      } else {
        router.push("/marketplace");
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to use template");
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      await templatesApi.like(templateId);
    },
    onSuccess: () => {
      setIsLiked(true);
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  // Rate mutation
  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      await templatesApi.rate(templateId, rating);
      return rating;
    },
    onSuccess: (rating) => {
      setUserRating(rating);
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
    },
  });

  const handleSubmitReview = useCallback(() => {
    if (!reviewText.trim() || userRating === 0) return;

    const newReview: Review = {
      id: Date.now().toString(),
      user_id: "current_user",
      user_name: "You",
      rating: userRating,
      comment: reviewText,
      created_at: new Date().toISOString(),
      helpful_count: 0,
    };
    setLocalReviews((prev) => [newReview, ...prev]);
    setReviewText("");
    toast.success("Review submitted successfully!");
  }, [reviewText, userRating]);

  const handleUse = useCallback(() => {
    useMutation_.mutate();
  }, [useMutation_]);

  const handleLike = useCallback(() => {
    likeMutation.mutate();
  }, [likeMutation]);

  const handleRate = useCallback((rating: number) => {
    rateMutation.mutate(rating);
  }, [rateMutation]);

  if (isLoading) {
    return (
      <DashboardLayout title="Template Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !template) {
    return (
      <DashboardLayout title="Template Details">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error instanceof Error ? error.message : "Template not found"}</p>
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const TypeIcon = typeIcons[template.template_type as keyof typeof typeIcons] || Layers;

  return (
    <DashboardLayout
      title={template.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleLike}
            disabled={isLiked}
            className={isLiked ? "text-red-500" : ""}
          >
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
            {template.likes}
          </Button>
          <Button onClick={handleUse} disabled={useMutation_.isPending}>
            {useMutation_.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Use Template
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                  <TypeIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{template.name}</h1>
                    {template.is_verified && (
                      <Badge variant="success" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {template.is_featured && (
                      <Badge variant="default" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      by {template.author_name || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {template.downloads} downloads
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {template.rating} ({template.rating_count} reviews)
                    </span>
                    <Badge variant="outline">{template.template_type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <Info className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="content">
                <Code className="h-4 w-4 mr-1" />
                Content
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-4 w-4 mr-1" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {template.long_description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {template.long_description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {template.use_cases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Use Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {template.use_cases.map((useCase, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {template.screenshots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Screenshots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {template.screenshots.map((screenshot, i) => (
                        <div key={i} className="relative aspect-video rounded-lg border overflow-hidden">
                          <Image
                            src={screenshot}
                            alt={`Screenshot ${i + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="content" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Content</CardTitle>
                  <CardDescription>
                    Preview the structure of this template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-sm overflow-x-auto max-h-96 whitespace-pre-wrap">
                      {JSON.stringify(template.content, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-4">
              {/* Write Review Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Write a Review
                  </CardTitle>
                  <CardDescription>
                    Share your experience with this template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Rating</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className={`p-1 transition-colors ${
                            star <= userRating
                              ? "text-yellow-500"
                              : "text-muted-foreground hover:text-yellow-500"
                          }`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= userRating ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      ))}
                      {userRating > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          {userRating} star{userRating !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review</Label>
                    <Textarea
                      id="review"
                      placeholder="Write your review here... What did you like? What could be improved?"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={!reviewText.trim() || userRating === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </Button>
                </CardContent>
              </Card>

              {/* Reviews Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reviews ({reviews.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold">{template.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({template.rating_count} reviews)
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet</p>
                      <p className="text-sm">Be the first to review this template!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {template.template_type}
                </Badge>
              </div>
              {template.category && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="secondary">{template.category.name}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-mono">{template.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-semibold">
                  {template.is_free ? "Free" : `$${template.price}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">
                  {new Date(template.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {template.tags.length > 0 && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Required Tools */}
          {template.required_tools.length > 0 && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Required Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {template.required_tools.map((tool) => (
                    <li
                      key={tool}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Required API Keys */}
          {template.required_api_keys.length > 0 && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Required API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {template.required_api_keys.map((key) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-sm font-mono"
                    >
                      <Key className="h-4 w-4 text-muted-foreground" />
                      {key}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
