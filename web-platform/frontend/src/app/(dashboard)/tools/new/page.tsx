"use client";

import { useState } from "react";
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
import { toolsApi } from "@/lib/api";
import {
  SimpleCodeEditor,
  DEFAULT_TOOL_TEMPLATE,
} from "@/components/tools/code-editor";
import {
  ArgsSchemaBuilder,
  argsToJsonSchema,
  jsonSchemaToArgs,
} from "@/components/tools/args-schema-builder";
import { ToolTestSandbox } from "@/components/tools/tool-test-sandbox";
import {
  ArrowLeft,
  Save,
  Loader2,
  Wrench,
  Code,
  Settings,
  FlaskConical,
  Plus,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";

interface ArgField {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: string;
  enum?: string[];
}

export default function NewToolPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedToolId, setSavedToolId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tool_type: "custom",
    custom_code: DEFAULT_TOOL_TEMPLATE,
    cache_enabled: true,
    result_as_answer: false,
    is_public: true,
    icon: "wrench",
    color: "#f97316",
  });

  const [argsSchema, setArgsSchema] = useState<ArgField[]>([
    {
      name: "query",
      type: "string",
      description: "The search query",
      required: true,
    },
  ]);

  const [envVars, setEnvVars] = useState<string[]>([]);
  const [newEnvVar, setNewEnvVar] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleSave = async () => {
    setError("");
    setIsSaving(true);

    try {
      const toolData = {
        ...formData,
        args_schema: argsToJsonSchema(argsSchema),
        env_vars: envVars,
        tags: tags,
        default_config: {},
      };

      const response = await toolsApi.create(toolData);
      setSavedToolId(response.data.id);
      router.push("/tools");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create tool");
    } finally {
      setIsSaving(false);
    }
  };

  const addEnvVar = () => {
    if (newEnvVar && !envVars.includes(newEnvVar)) {
      setEnvVars([...envVars, newEnvVar]);
      setNewEnvVar("");
    }
  };

  const removeEnvVar = (varName: string) => {
    setEnvVars(envVars.filter((v) => v !== varName));
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag.toLowerCase()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <DashboardLayout
      title="Create Custom Tool"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/tools">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.name}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Tool
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
            <Wrench className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="args" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Arguments
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tool Details</CardTitle>
                <CardDescription>
                  Basic information about your custom tool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tool Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="my_custom_tool"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use snake_case for tool names (e.g., web_search_tool)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this tool does..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This description helps the AI understand when to use this
                    tool
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) =>
                        setFormData({ ...formData, icon: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wrench">Wrench</SelectItem>
                        <SelectItem value="code">Code</SelectItem>
                        <SelectItem value="globe">Globe</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="search">Search</SelectItem>
                        <SelectItem value="zap">Zap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="#f97316"
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Tool behavior and visibility settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Results</Label>
                    <p className="text-xs text-muted-foreground">
                      Cache tool results for identical inputs
                    </p>
                  </div>
                  <Switch
                    checked={formData.cache_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, cache_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Result as Answer</Label>
                    <p className="text-xs text-muted-foreground">
                      Use tool result directly as the final answer
                    </p>
                  </div>
                  <Switch
                    checked={formData.result_as_answer}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, result_as_answer: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Tool</Label>
                    <p className="text-xs text-muted-foreground">
                      Make tool available to other users
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_public: checked })
                    }
                  />
                </div>

                {/* Environment Variables */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Required Environment Variables</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newEnvVar}
                      onChange={(e) =>
                        setNewEnvVar(e.target.value.toUpperCase())
                      }
                      placeholder="API_KEY"
                      className="font-mono"
                      onKeyPress={(e) => e.key === "Enter" && addEnvVar()}
                    />
                    <Button onClick={addEnvVar} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {envVars.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {envVars.map((varName) => (
                        <Badge key={varName} variant="secondary">
                          {varName}
                          <button
                            onClick={() => removeEnvVar(varName)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="search, api, utility"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Tool Code</CardTitle>
                  <CardDescription>
                    Write Python code for your custom tool using CrewAI&apos;s
                    BaseTool
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      custom_code: DEFAULT_TOOL_TEMPLATE,
                    })
                  }
                >
                  Reset to Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleCodeEditor
                value={formData.custom_code}
                onChange={(value) =>
                  setFormData({ ...formData, custom_code: value })
                }
                height="500px"
              />

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Tool Structure:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Extend <code className="bg-muted px-1">BaseTool</code>{" "}
                        from crewai.tools
                      </li>
                      <li>
                        Define{" "}
                        <code className="bg-muted px-1">name</code>,{" "}
                        <code className="bg-muted px-1">description</code>, and{" "}
                        <code className="bg-muted px-1">args_schema</code>
                      </li>
                      <li>
                        Implement the{" "}
                        <code className="bg-muted px-1">_run</code> method
                      </li>
                      <li>
                        Use Pydantic{" "}
                        <code className="bg-muted px-1">BaseModel</code> for
                        input validation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arguments Tab */}
        <TabsContent value="args">
          <Card>
            <CardHeader>
              <CardTitle>Arguments Schema</CardTitle>
              <CardDescription>
                Define the input parameters your tool accepts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArgsSchemaBuilder
                schema={argsSchema}
                onChange={setArgsSchema}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Sandbox</CardTitle>
              <CardDescription>
                Test your tool with sample inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ToolTestSandbox
                toolId={savedToolId || undefined}
                argsSchema={argsToJsonSchema(argsSchema)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
