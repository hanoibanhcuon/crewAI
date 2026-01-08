"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { tasksApi, agentsApi, toolsApi } from "@/lib/api";
import { Loader2, Plus, X } from "lucide-react";

interface TaskFormData {
  name: string;
  description: string;
  expected_output: string;
  agent_id: string | null;
  async_execution: boolean;
  human_input: boolean;
  markdown: boolean;
  output_file: string;
  output_json_schema: string;
  output_pydantic_model: string;
  create_directory: boolean;
  callback_url: string;
  guardrail_max_retries: number;
  tools: string[];
  dependency_ids: string[];
  is_public: boolean;
  tags: string[];
}

interface TaskFormProps {
  taskId?: string;
  initialData?: Partial<TaskFormData>;
  onSuccess?: () => void;
}

export function TaskForm({ taskId, initialData, onSuccess }: TaskFormProps) {
  const router = useRouter();
  const isEditing = !!taskId;

  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    expected_output: "",
    agent_id: null,
    async_execution: false,
    human_input: false,
    markdown: false,
    output_file: "",
    output_json_schema: "",
    output_pydantic_model: "",
    create_directory: false,
    callback_url: "",
    guardrail_max_retries: 0,
    tools: [],
    dependency_ids: [],
    is_public: false,
    tags: [],
    ...initialData,
  });

  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, toolsRes, tasksRes] = await Promise.all([
          agentsApi.list(),
          toolsApi.list(),
          tasksApi.list(),
        ]);
        setAvailableAgents(agentsRes.data.items || agentsRes.data || []);
        setAvailableTools(toolsRes.data.items || toolsRes.data || []);
        // Filter out current task from dependencies
        const tasks = (tasksRes.data.items || tasksRes.data || []).filter(
          (t: any) => t.id !== taskId
        );
        setAvailableTasks(tasks);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [taskId]);

  const updateField = <K extends keyof TaskFormData>(
    field: K,
    value: TaskFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (formData.tools.includes(toolId)) {
      updateField(
        "tools",
        formData.tools.filter((id) => id !== toolId)
      );
    } else {
      updateField("tools", [...formData.tools, toolId]);
    }
  };

  const toggleDependency = (taskId: string) => {
    if (formData.dependency_ids.includes(taskId)) {
      updateField(
        "dependency_ids",
        formData.dependency_ids.filter((id) => id !== taskId)
      );
    } else {
      updateField("dependency_ids", [...formData.dependency_ids, taskId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        agent_id: formData.agent_id || null,
        output_json_schema: formData.output_json_schema
          ? JSON.parse(formData.output_json_schema)
          : null,
        output_file: formData.output_file || null,
        output_pydantic_model: formData.output_pydantic_model || null,
        callback_url: formData.callback_url || null,
      };

      if (isEditing) {
        await tasksApi.update(taskId, payload);
      } else {
        await tasksApi.create(payload);
      }
      onSuccess?.();
      router.push("/tasks");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Không thể lưu nhiệm vụ. Vui lòng thử lại."
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
          <TabsTrigger value="execution">Thực thi</TabsTrigger>
          <TabsTrigger value="output">Đầu ra</TabsTrigger>
          <TabsTrigger value="dependencies">Phụ thuộc</TabsTrigger>
          <TabsTrigger value="tools">Công cụ</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin nhiệm vụ</CardTitle>
              <CardDescription>
                Thông tin cơ bản về nhiệm vụ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên *</Label>
                <Input
                  id="name"
                  placeholder="Nghiên cứu chủ đề"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về những gì nhiệm vụ này cần hoàn thành..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_output">Kết quả mong đợi *</Label>
                <Textarea
                  id="expected_output"
                  placeholder="Một báo cáo toàn diện chứa..."
                  value={formData.expected_output}
                  onChange={(e) => updateField("expected_output", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tác nhân được giao</Label>
                {isLoadingData ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải tác nhân...
                  </div>
                ) : (
                  <Select
                    value={formData.agent_id || "none"}
                    onValueChange={(value) =>
                      updateField("agent_id", value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tác nhân" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có tác nhân cụ thể</SelectItem>
                      {availableAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} - {agent.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thực thi</CardTitle>
              <CardDescription>
                Cấu hình cách nhiệm vụ này được thực thi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Thực thi bất đồng bộ</Label>
                  <p className="text-sm text-muted-foreground">
                    Chạy nhiệm vụ này bất đồng bộ
                  </p>
                </div>
                <Switch
                  checked={formData.async_execution}
                  onCheckedChange={(checked) =>
                    updateField("async_execution", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nhập liệu từ người dùng</Label>
                  <p className="text-sm text-muted-foreground">
                    Yêu cầu nhập liệu từ người dùng trong quá trình thực thi
                  </p>
                </div>
                <Switch
                  checked={formData.human_input}
                  onCheckedChange={(checked) =>
                    updateField("human_input", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Đầu ra Markdown</Label>
                  <p className="text-sm text-muted-foreground">
                    Định dạng đầu ra dưới dạng markdown
                  </p>
                </div>
                <Switch
                  checked={formData.markdown}
                  onCheckedChange={(checked) => updateField("markdown", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callback_url">URL Callback</Label>
                <Input
                  id="callback_url"
                  type="url"
                  placeholder="https://example.com/webhook"
                  value={formData.callback_url}
                  onChange={(e) => updateField("callback_url", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL để gọi khi nhiệm vụ hoàn thành
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardrail_retries">Số lần thử lại tối đa Guardrail</Label>
                <Input
                  id="guardrail_retries"
                  type="number"
                  min={0}
                  value={formData.guardrail_max_retries}
                  onChange={(e) =>
                    updateField("guardrail_max_retries", parseInt(e.target.value) || 0)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nhiệm vụ công khai</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép người dùng khác nhìn thấy nhiệm vụ này
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

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình đầu ra</CardTitle>
              <CardDescription>
                Cấu hình cách cấu trúc đầu ra của nhiệm vụ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="output_file">Đường dẫn tệp đầu ra</Label>
                <Input
                  id="output_file"
                  placeholder="output/report.md"
                  value={formData.output_file}
                  onChange={(e) => updateField("output_file", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Lưu đầu ra vào tệp tại đường dẫn này
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tạo thư mục</Label>
                  <p className="text-sm text-muted-foreground">
                    Tạo thư mục đầu ra nếu chưa tồn tại
                  </p>
                </div>
                <Switch
                  checked={formData.create_directory}
                  onCheckedChange={(checked) =>
                    updateField("create_directory", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="output_json_schema">JSON Schema</Label>
                <Textarea
                  id="output_json_schema"
                  placeholder='{"type": "object", "properties": {...}}'
                  value={formData.output_json_schema}
                  onChange={(e) => updateField("output_json_schema", e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Định nghĩa JSON schema cho đầu ra có cấu trúc
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="output_pydantic">Pydantic Model</Label>
                <Input
                  id="output_pydantic"
                  placeholder="app.models.ReportOutput"
                  value={formData.output_pydantic_model}
                  onChange={(e) =>
                    updateField("output_pydantic_model", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Đường dẫn đầy đủ đến Pydantic model để xác thực đầu ra
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phụ thuộc nhiệm vụ</CardTitle>
              <CardDescription>
                Chọn các nhiệm vụ phải hoàn thành trước khi nhiệm vụ này chạy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Không có nhiệm vụ khác cho phụ thuộc.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.dependency_ids.includes(task.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleDependency(task.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.dependency_ids.includes(task.id)}
                          onCheckedChange={() => toggleDependency(task.id)}
                        />
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
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

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ghi đè công cụ</CardTitle>
              <CardDescription>
                Chọn công cụ cụ thể cho nhiệm vụ này (ghi đè công cụ của tác nhân)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
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
                        formData.tools.includes(tool.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleTool(tool.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={formData.tools.includes(tool.id)}
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
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/tasks")}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Cập nhật nhiệm vụ" : "Tạo nhiệm vụ"}
        </Button>
      </div>
    </form>
  );
}
