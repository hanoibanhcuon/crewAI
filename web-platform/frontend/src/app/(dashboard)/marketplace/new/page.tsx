"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { templatesApi, crewsApi, flowsApi, agentsApi } from "@/lib/api";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  Upload,
  Users,
  Layers,
  GitBranch,
  Package,
  FileText,
  Tag,
  Image as ImageIcon,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Resource lists for selection
  const [crews, setCrews] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    long_description: "",
    template_type: "crew",
    is_free: true,
    price: 0,
    preview_image: "",
  });

  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [newUseCase, setNewUseCase] = useState("");
  const [requiredTools, setRequiredTools] = useState<string[]>([]);
  const [newTool, setNewTool] = useState("");
  const [requiredApiKeys, setRequiredApiKeys] = useState<string[]>([]);
  const [newApiKey, setNewApiKey] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshot, setNewScreenshot] = useState("");

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const [crewsRes, flowsRes, agentsRes] = await Promise.all([
        crewsApi.list(),
        flowsApi.list(),
        agentsApi.list(),
      ]);
      setCrews(crewsRes.data?.items || []);
      setFlows(flowsRes.data?.items || []);
      setAgents(agentsRes.data?.items || []);
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleSave = async () => {
    setError("");

    if (!formData.name) {
      setError("Name is required");
      return;
    }

    if (!selectedResourceId) {
      setError("Please select a resource to create template from");
      return;
    }

    setIsSaving(true);

    try {
      // Get the content from the selected resource
      let content = {};
      if (formData.template_type === "crew") {
        const response = await crewsApi.get(selectedResourceId);
        content = response.data;
      } else if (formData.template_type === "flow") {
        const response = await flowsApi.get(selectedResourceId);
        content = response.data;
      } else if (formData.template_type === "agent") {
        const response = await agentsApi.get(selectedResourceId);
        content = response.data;
      }

      const templateData = {
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description,
        template_type: formData.template_type,
        content,
        preview_image: formData.preview_image || undefined,
        screenshots,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : formData.price,
        tags,
        use_cases: useCases,
        required_tools: requiredTools,
        required_api_keys: requiredApiKeys,
      };

      await templatesApi.create(templateData);
      router.push("/marketplace");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag.toLowerCase())) {
      setTags([...tags, newTag.toLowerCase()]);
      setNewTag("");
    }
  };

  const addUseCase = () => {
    if (newUseCase && !useCases.includes(newUseCase)) {
      setUseCases([...useCases, newUseCase]);
      setNewUseCase("");
    }
  };

  const addTool = () => {
    if (newTool && !requiredTools.includes(newTool)) {
      setRequiredTools([...requiredTools, newTool]);
      setNewTool("");
    }
  };

  const addApiKey = () => {
    if (newApiKey && !requiredApiKeys.includes(newApiKey.toUpperCase())) {
      setRequiredApiKeys([...requiredApiKeys, newApiKey.toUpperCase()]);
      setNewApiKey("");
    }
  };

  const addScreenshot = () => {
    if (newScreenshot && !screenshots.includes(newScreenshot)) {
      setScreenshots([...screenshots, newScreenshot]);
      setNewScreenshot("");
    }
  };

  const getResourceOptions = () => {
    switch (formData.template_type) {
      case "crew":
        return crews;
      case "flow":
        return flows;
      case "agent":
        return agents;
      default:
        return [];
    }
  };

  return (
    <DashboardLayout
      title="Create Template"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.name}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Publish Template
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="metadata" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Media
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
                <CardDescription>
                  Basic information about your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My Awesome Template"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Short Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of what this template does..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Long Description</Label>
                  <Textarea
                    value={formData.long_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        long_description: e.target.value,
                      })
                    }
                    placeholder="Detailed description with features, use cases, etc..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Set the pricing for your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Free Template</Label>
                    <p className="text-xs text-muted-foreground">
                      Make this template available for free
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_free: checked })
                    }
                  />
                </div>

                {!formData.is_free && (
                  <div className="space-y-2">
                    <Label>Price (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        min={0}
                        step={0.01}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Select Source</CardTitle>
              <CardDescription>
                Choose an existing resource to create a template from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, template_type: value });
                    setSelectedResourceId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crew">
                      <span className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Crew
                      </span>
                    </SelectItem>
                    <SelectItem value="flow">
                      <span className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Flow
                      </span>
                    </SelectItem>
                    <SelectItem value="agent">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Agent
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source {formData.template_type}</Label>
                {isLoadingResources ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={selectedResourceId}
                    onValueChange={setSelectedResourceId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select a ${formData.template_type}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {getResourceOptions().map((resource) => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {getResourceOptions().length === 0 && !isLoadingResources && (
                  <p className="text-sm text-muted-foreground">
                    No {formData.template_type}s found. Create one first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to help users find your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="e.g., automation, research"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button onClick={addTag} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
                <CardDescription>
                  Describe what users can do with this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newUseCase}
                    onChange={(e) => setNewUseCase(e.target.value)}
                    placeholder="e.g., Automate content creation"
                    onKeyPress={(e) => e.key === "Enter" && addUseCase()}
                  />
                  <Button onClick={addUseCase} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {useCases.length > 0 && (
                  <ul className="space-y-2">
                    {useCases.map((useCase, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <span className="text-sm">{useCase}</span>
                        <button
                          onClick={() =>
                            setUseCases(useCases.filter((_, idx) => idx !== i))
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Tools</CardTitle>
                <CardDescription>
                  Tools that this template depends on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    placeholder="e.g., SerperDevTool"
                    onKeyPress={(e) => e.key === "Enter" && addTool()}
                  />
                  <Button onClick={addTool} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {requiredTools.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requiredTools.map((tool) => (
                      <Badge key={tool} variant="outline">
                        {tool}
                        <button
                          onClick={() =>
                            setRequiredTools(requiredTools.filter((t) => t !== tool))
                          }
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required API Keys</CardTitle>
                <CardDescription>
                  Environment variables needed to run this template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value.toUpperCase())}
                    placeholder="e.g., OPENAI_API_KEY"
                    className="font-mono"
                    onKeyPress={(e) => e.key === "Enter" && addApiKey()}
                  />
                  <Button onClick={addApiKey} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {requiredApiKeys.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {requiredApiKeys.map((key) => (
                      <Badge key={key} variant="secondary" className="font-mono">
                        {key}
                        <button
                          onClick={() =>
                            setRequiredApiKeys(requiredApiKeys.filter((k) => k !== key))
                          }
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Preview Image</CardTitle>
                <CardDescription>
                  Main image displayed in the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={formData.preview_image}
                    onChange={(e) =>
                      setFormData({ ...formData, preview_image: e.target.value })
                    }
                    placeholder="https://example.com/image.png"
                  />
                </div>
                {formData.preview_image && (
                  <div className="border rounded-lg p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.preview_image}
                      alt="Preview"
                      className="w-full rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Screenshots</CardTitle>
                <CardDescription>
                  Additional images showcasing your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newScreenshot}
                    onChange={(e) => setNewScreenshot(e.target.value)}
                    placeholder="https://example.com/screenshot.png"
                    onKeyPress={(e) => e.key === "Enter" && addScreenshot()}
                  />
                  <Button onClick={addScreenshot} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {screenshots.map((url, i) => (
                      <div key={i} className="relative border rounded-lg p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          className="w-full rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <button
                          onClick={() =>
                            setScreenshots(screenshots.filter((_, idx) => idx !== i))
                          }
                          className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
