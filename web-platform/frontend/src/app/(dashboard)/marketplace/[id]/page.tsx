"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Calendar,
  Tag,
  Key,
  Wrench,
  Check,
  Info,
  FileText,
  Code,
} from "lucide-react";
import Link from "next/link";

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
}

const typeIcons = {
  crew: Layers,
  flow: GitBranch,
  agent: Users,
};

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUsing, setIsUsing] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await templatesApi.get(templateId);
        setTemplate(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load template");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  const handleUse = async () => {
    setIsUsing(true);
    try {
      const response = await templatesApi.use(templateId);
      // Redirect to the created resource
      if (response.data.type === "crew") {
        router.push(`/crews/${response.data.id}/edit`);
      } else if (response.data.type === "flow") {
        router.push(`/flows/${response.data.id}/edit`);
      } else if (response.data.type === "agent") {
        router.push(`/agents/${response.data.id}`);
      } else {
        router.push("/marketplace");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to use template");
    } finally {
      setIsUsing(false);
    }
  };

  const handleLike = async () => {
    try {
      await templatesApi.like(templateId);
      setIsLiked(true);
      if (template) {
        setTemplate({ ...template, likes: template.likes + 1 });
      }
    } catch (err) {
      console.error("Failed to like template:", err);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await templatesApi.rate(templateId, rating);
      setUserRating(rating);
      // Update local rating (simplified)
      if (template) {
        const newCount = template.rating_count + 1;
        const newRating =
          (template.rating * template.rating_count + rating) / newCount;
        setTemplate({
          ...template,
          rating: Math.round(newRating * 10) / 10,
          rating_count: newCount,
        });
      }
    } catch (err) {
      console.error("Failed to rate template:", err);
    }
  };

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
          <p className="text-red-500 mb-4">{error || "Template not found"}</p>
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
          <Button onClick={handleUse} disabled={isUsing}>
            {isUsing ? (
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
                        <img
                          key={i}
                          src={screenshot}
                          alt={`Screenshot ${i + 1}`}
                          className="rounded-lg border"
                        />
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

            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rate this Template</CardTitle>
                  <CardDescription>
                    Share your experience with this template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
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
                        You rated {userRating} star(s)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This template has {template.rating_count} reviews with an average
                    rating of {template.rating} stars.
                  </p>
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
