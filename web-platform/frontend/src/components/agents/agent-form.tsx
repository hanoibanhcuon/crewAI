"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { agentsApi, toolsApi } from "@/lib/api";
import { Loader2, Plus, X } from "lucide-react";

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "groq", label: "Groq" },
  { value: "ollama", label: "Ollama" },
];

const LLM_MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  google: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-pro", label: "Gemini Pro" },
  ],
  azure: [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-35-turbo", label: "GPT-3.5 Turbo" },
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  ],
  ollama: [
    { value: "llama3.2", label: "Llama 3.2" },
    { value: "llama3.1", label: "Llama 3.1" },
    { value: "mistral", label: "Mistral" },
    { value: "codellama", label: "Code Llama" },
  ],
};

const MEMORY_TYPES = [
  { value: "short_term", label: "Ngắn hạn" },
  { value: "long_term", label: "Dài hạn" },
  { value: "entity", label: "Bộ nhớ thực thể" },
];

interface AgentFormData {
  name: string;
  description: string;
  role: string;
  goal: string;
  backstory: string;
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_tokens: number | null;
  verbose: boolean;
  allow_delegation: boolean;
  max_iter: number;
  max_rpm: number | null;
  max_retry_limit: number;
  memory_enabled: boolean;
  memory_type: string;
  allow_code_execution: boolean;
  code_execution_mode: string;
  system_prompt: string;
  tool_ids: string[];
  is_public: boolean;
  tags: string[];
}

interface AgentFormProps {
  agentId?: string;
  initialData?: Partial<AgentFormData>;
  onSuccess?: () => void;
}

export function AgentForm({ agentId, initialData, onSuccess }: AgentFormProps) {
  const router = useRouter();
  const isEditing = !!agentId;

  const [formData, setFormData] = useState<AgentFormData>({
    name: "",
    description: "",
    role: "",
    goal: "",
    backstory: "",
    llm_provider: "openai",
    llm_model: "gpt-4",
    temperature: 0.7,
    max_tokens: null,
    verbose: true,
    allow_delegation: false,
    max_iter: 25,
    max_rpm: null,
    max_retry_limit: 2,
    memory_enabled: true,
    memory_type: "short_term",
    allow_code_execution: false,
    code_execution_mode: "safe",
    system_prompt: "",
    tool_ids: [],
    is_public: false,
    tags: [],
    ...initialData,
  });

  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await toolsApi.list();
        setAvailableTools(response.data.items || response.data || []);
      } catch (err) {
        console.error("Failed to fetch tools:", err);
      } finally {
        setIsLoadingTools(false);
      }
    };
    fetchTools();
  }, []);

  const updateField = <K extends keyof AgentFormData>(
    field: K,
    value: AgentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProviderChange = (provider: string) => {
    updateField("llm_provider", provider);
    const models = LLM_MODELS[provider];
    if (models && models.length > 0) {
      updateField("llm_model", models[0].value);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      updateField("tags", [...formData.tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    updateField(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const toggleTool = (toolId: string) => {
    if (formData.tool_ids.includes(toolId)) {
      updateField(
        "tool_ids",
        formData.tool_ids.filter((id) => id !== toolId)
      );
    } else {
      updateField("tool_ids", [...formData.tool_ids, toolId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isEditing) {
        await agentsApi.update(agentId, formData);
      } else {
        await agentsApi.create(formData);
      }
      onSuccess?.();
      router.push("/agents");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Không thể lưu tác nhân. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="llm">Cài đặt LLM</TabsTrigger>
          <TabsTrigger value="behavior">Hành vi</TabsTrigger>
          <TabsTrigger value="tools">Công cụ</TabsTrigger>
          <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tác nhân</CardTitle>
              <CardDescription>
                Thông tin cơ bản về tác nhân AI của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên *</Label>
                  <Input
                    id="name"
                    placeholder="Chuyên viên nghiên cứu"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò *</Label>
                  <Input
                    id="role"
                    placeholder="Chuyên viên phân tích cao cấp"
                    value={formData.role}
                    onChange={(e) => updateField("role", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Mục tiêu *</Label>
                <Textarea
                  id="goal"
                  placeholder="Tìm kiếm và phân tích dữ liệu từ nhiều nguồn để cung cấp báo cáo nghiên cứu toàn diện"
                  value={formData.goal}
                  onChange={(e) => updateField("goal", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backstory">Câu chuyện nền</Label>
                <Textarea
                  id="backstory"
                  placeholder="Bạn là một chuyên gia phân tích kỳ cựu với hàng chục năm kinh nghiệm..."
                  value={formData.backstory}
                  onChange={(e) => updateField("backstory", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả ngắn gọn về chức năng của tác nhân này"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Thẻ</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Thêm thẻ"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          type="button"
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
        </TabsContent>

        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình LLM</CardTitle>
              <CardDescription>
                Cấu hình mô hình ngôn ngữ cho tác nhân này
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nhà cung cấp</Label>
                  <Select
                    value={formData.llm_provider}
                    onValueChange={handleProviderChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mô hình</Label>
                  <Select
                    value={formData.llm_model}
                    onValueChange={(value) => updateField("llm_model", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(LLM_MODELS[formData.llm_provider] || []).map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Nhiệt độ: {formData.temperature}</Label>
                </div>
                <Slider
                  value={[formData.temperature]}
                  onValueChange={([value]) => updateField("temperature", value)}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Giá trị thấp hơn cho kết quả tập trung hơn, giá trị cao hơn cho kết quả sáng tạo hơn
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Token tối đa (tùy chọn)</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  placeholder="Để trống để sử dụng mặc định"
                  value={formData.max_tokens || ""}
                  onChange={(e) =>
                    updateField(
                      "max_tokens",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt hành vi</CardTitle>
              <CardDescription>
                Cấu hình cách tác nhân hoạt động trong quá trình thực thi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Chế độ chi tiết</Label>
                  <p className="text-sm text-muted-foreground">
                    Bật ghi log chi tiết các hành động của tác nhân
                  </p>
                </div>
                <Switch
                  checked={formData.verbose}
                  onCheckedChange={(checked) => updateField("verbose", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cho phép ủy quyền</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép tác nhân này ủy quyền nhiệm vụ cho các tác nhân khác
                  </p>
                </div>
                <Switch
                  checked={formData.allow_delegation}
                  onCheckedChange={(checked) =>
                    updateField("allow_delegation", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bộ nhớ</Label>
                  <p className="text-sm text-muted-foreground">
                    Bật bộ nhớ để duy trì ngữ cảnh
                  </p>
                </div>
                <Switch
                  checked={formData.memory_enabled}
                  onCheckedChange={(checked) =>
                    updateField("memory_enabled", checked)
                  }
                />
              </div>

              {formData.memory_enabled && (
                <div className="space-y-2">
                  <Label>Loại bộ nhớ</Label>
                  <Select
                    value={formData.memory_type}
                    onValueChange={(value) => updateField("memory_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMORY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxIter">Số lần lặp tối đa</Label>
                  <Input
                    id="maxIter"
                    type="number"
                    value={formData.max_iter}
                    onChange={(e) =>
                      updateField("max_iter", parseInt(e.target.value) || 25)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRpm">RPM tối đa (tùy chọn)</Label>
                  <Input
                    id="maxRpm"
                    type="number"
                    placeholder="Không giới hạn"
                    value={formData.max_rpm || ""}
                    onChange={(e) =>
                      updateField(
                        "max_rpm",
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRetry">Số lần thử lại tối đa</Label>
                  <Input
                    id="maxRetry"
                    type="number"
                    value={formData.max_retry_limit}
                    onChange={(e) =>
                      updateField("max_retry_limit", parseInt(e.target.value) || 2)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Công cụ</CardTitle>
              <CardDescription>
                Chọn các công cụ mà tác nhân này có thể sử dụng
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableTools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Không có công cụ nào.</p>
                  <Button
                    variant="link"
                    onClick={() => router.push("/tools/new")}
                  >
                    Tạo công cụ đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {availableTools.map((tool: any) => (
                    <div
                      key={tool.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.tool_ids.includes(tool.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleTool(tool.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.tool_ids.includes(tool.id)}
                          onCheckedChange={() => toggleTool(tool.id)}
                        />
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt nâng cao</CardTitle>
              <CardDescription>
                Cấu hình các cài đặt tác nhân nâng cao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thực thi code</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép tác nhân thực thi code
                  </p>
                </div>
                <Switch
                  checked={formData.allow_code_execution}
                  onCheckedChange={(checked) =>
                    updateField("allow_code_execution", checked)
                  }
                />
              </div>

              {formData.allow_code_execution && (
                <div className="space-y-2">
                  <Label>Chế độ thực thi</Label>
                  <Select
                    value={formData.code_execution_mode}
                    onValueChange={(value) =>
                      updateField("code_execution_mode", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safe">An toàn (Sandbox)</SelectItem>
                      <SelectItem value="unsafe">Không an toàn (Trực tiếp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt hệ thống tùy chỉnh</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Ghi đè prompt hệ thống mặc định cho tác nhân này..."
                  value={formData.system_prompt}
                  onChange={(e) => updateField("system_prompt", e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tác nhân công khai</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người dùng khác nhìn thấy tác nhân này
                  </p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => updateField("is_public", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/agents")}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Cập nhật tác nhân" : "Tạo tác nhân"}
        </Button>
      </div>
    </form>
  );
}
