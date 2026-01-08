"use client";

import { useState, useEffect, useCallback } from "react";
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
import { crewsApi, agentsApi, tasksApi } from "@/lib/api";
import {
  Loader2,
  Plus,
  X,
  GripVertical,
  Bot,
  ListTodo,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";

interface CrewAgentConfig {
  agent_id: string;
  order: number;
  config_override: Record<string, any>;
}

interface CrewTaskConfig {
  task_id: string;
  order: number;
  config_override: Record<string, any>;
}

interface CrewFormData {
  name: string;
  description: string;
  process: string;
  verbose: boolean;
  manager_agent_id: string | null;
  manager_llm: string;
  respect_context_window: boolean;
  memory_enabled: boolean;
  cache_enabled: boolean;
  max_rpm: number | null;
  full_output: boolean;
  planning: boolean;
  planning_llm: string;
  stream: boolean;
  output_log_file: string;
  agents: CrewAgentConfig[];
  tasks: CrewTaskConfig[];
  is_public: boolean;
  tags: string[];
}

interface CrewBuilderProps {
  crewId?: string;
  initialData?: Partial<CrewFormData>;
  onSuccess?: () => void;
}

export function CrewBuilder({ crewId, initialData, onSuccess }: CrewBuilderProps) {
  const router = useRouter();
  const isEditing = !!crewId;

  const [formData, setFormData] = useState<CrewFormData>({
    name: "",
    description: "",
    process: "sequential",
    verbose: true,
    manager_agent_id: null,
    manager_llm: "gpt-4",
    respect_context_window: true,
    memory_enabled: false,
    cache_enabled: true,
    max_rpm: null,
    full_output: false,
    planning: false,
    planning_llm: "gpt-4",
    stream: false,
    output_log_file: "",
    agents: [],
    tasks: [],
    is_public: false,
    tags: [],
    ...initialData,
  });

  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentsRes, tasksRes] = await Promise.all([
          agentsApi.list(),
          tasksApi.list(),
        ]);
        setAvailableAgents(agentsRes.data.items || agentsRes.data || []);
        setAvailableTasks(tasksRes.data.items || tasksRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const updateField = <K extends keyof CrewFormData>(
    field: K,
    value: CrewFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Agent management
  const addAgent = (agentId: string) => {
    if (formData.agents.find((a) => a.agent_id === agentId)) return;
    const newAgent: CrewAgentConfig = {
      agent_id: agentId,
      order: formData.agents.length,
      config_override: {},
    };
    updateField("agents", [...formData.agents, newAgent]);
  };

  const removeAgent = (agentId: string) => {
    const updated = formData.agents
      .filter((a) => a.agent_id !== agentId)
      .map((a, idx) => ({ ...a, order: idx }));
    updateField("agents", updated);
  };

  const moveAgent = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.agents.length) return;
    const updated = [...formData.agents];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateField(
      "agents",
      updated.map((a, idx) => ({ ...a, order: idx }))
    );
  };

  // Task management
  const addTask = (taskId: string) => {
    if (formData.tasks.find((t) => t.task_id === taskId)) return;
    const newTask: CrewTaskConfig = {
      task_id: taskId,
      order: formData.tasks.length,
      config_override: {},
    };
    updateField("tasks", [...formData.tasks, newTask]);
  };

  const removeTask = (taskId: string) => {
    const updated = formData.tasks
      .filter((t) => t.task_id !== taskId)
      .map((t, idx) => ({ ...t, order: idx }));
    updateField("tasks", updated);
  };

  const moveTask = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.tasks.length) return;
    const updated = [...formData.tasks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updateField(
      "tasks",
      updated.map((t, idx) => ({ ...t, order: idx }))
    );
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

  const getAgentById = (id: string) =>
    availableAgents.find((a) => a.id === id);

  const getTaskById = (id: string) =>
    availableTasks.find((t) => t.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        manager_agent_id: formData.manager_agent_id || null,
        max_rpm: formData.max_rpm || null,
        output_log_file: formData.output_log_file || null,
      };

      if (isEditing) {
        await crewsApi.update(crewId, payload);
      } else {
        await crewsApi.create(payload);
      }
      onSuccess?.();
      router.push("/crews");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to save crew. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const unassignedAgents = availableAgents.filter(
    (a) => !formData.agents.find((ca) => ca.agent_id === a.id)
  );

  const unassignedTasks = availableTasks.filter(
    (t) => !formData.tasks.find((ct) => ct.task_id === t.id)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="agents">Agents ({formData.agents.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({formData.tasks.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crew Information</CardTitle>
              <CardDescription>Basic information about your crew</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Research Team"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Process Type</Label>
                  <Select
                    value={formData.process}
                    onValueChange={(value) => updateField("process", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A team of AI agents that work together to..."
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>

              {formData.process === "hierarchical" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Hierarchical Settings</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Manager Agent</Label>
                      {isLoadingData ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <Select
                          value={formData.manager_agent_id || "none"}
                          onValueChange={(value) =>
                            updateField(
                              "manager_agent_id",
                              value === "none" ? null : value
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Auto (LLM-based)</SelectItem>
                            {availableAgents.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerLlm">Manager LLM</Label>
                      <Input
                        id="managerLlm"
                        placeholder="gpt-4"
                        value={formData.manager_llm}
                        onChange={(e) =>
                          updateField("manager_llm", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
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

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Available Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Agents</CardTitle>
                <CardDescription>Click to add agents to your crew</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : unassignedAgents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No available agents</p>
                    {availableAgents.length === 0 && (
                      <Button
                        variant="link"
                        onClick={() => router.push("/agents/new")}
                      >
                        Create an agent first
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {unassignedAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => addAgent(agent.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{agent.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {agent.role}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crew Agents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crew Agents</CardTitle>
                <CardDescription>
                  Drag to reorder, agents run in this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Add agents from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.agents
                      .sort((a, b) => a.order - b.order)
                      .map((config, index) => {
                        const agent = getAgentById(config.agent_id);
                        if (!agent) return null;
                        return (
                          <div
                            key={config.agent_id}
                            className="p-3 border rounded-lg bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveAgent(index, "up")}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveAgent(index, "down")}
                                  disabled={index === formData.agents.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {index + 1}. {agent.name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {agent.role}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => removeAgent(config.agent_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Available Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Tasks</CardTitle>
                <CardDescription>Click to add tasks to your crew</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : unassignedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No available tasks</p>
                    {availableTasks.length === 0 && (
                      <Button
                        variant="link"
                        onClick={() => router.push("/tasks/new")}
                      >
                        Create a task first
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {unassignedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => addTask(task.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                            <ListTodo className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{task.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {task.description}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crew Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crew Tasks</CardTitle>
                <CardDescription>
                  Tasks run in this order (sequential process)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <ListTodo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Add tasks from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.tasks
                      .sort((a, b) => a.order - b.order)
                      .map((config, index) => {
                        const task = getTaskById(config.task_id);
                        if (!task) return null;
                        return (
                          <div
                            key={config.task_id}
                            className="p-3 border rounded-lg bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveTask(index, "up")}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveTask(index, "down")}
                                  disabled={index === formData.tasks.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                <ListTodo className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {index + 1}. {task.name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {task.expected_output}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => removeTask(config.task_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
              <CardDescription>Configure crew execution behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verbose Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed logging
                    </p>
                  </div>
                  <Switch
                    checked={formData.verbose}
                    onCheckedChange={(checked) => updateField("verbose", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Memory</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable crew memory
                    </p>
                  </div>
                  <Switch
                    checked={formData.memory_enabled}
                    onCheckedChange={(checked) =>
                      updateField("memory_enabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cache</Label>
                    <p className="text-sm text-muted-foreground">
                      Cache tool results
                    </p>
                  </div>
                  <Switch
                    checked={formData.cache_enabled}
                    onCheckedChange={(checked) =>
                      updateField("cache_enabled", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Planning</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable task planning
                    </p>
                  </div>
                  <Switch
                    checked={formData.planning}
                    onCheckedChange={(checked) => updateField("planning", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Streaming</Label>
                    <p className="text-sm text-muted-foreground">
                      Stream execution output
                    </p>
                  </div>
                  <Switch
                    checked={formData.stream}
                    onCheckedChange={(checked) => updateField("stream", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Full Output</Label>
                    <p className="text-sm text-muted-foreground">
                      Return all task outputs
                    </p>
                  </div>
                  <Switch
                    checked={formData.full_output}
                    onCheckedChange={(checked) =>
                      updateField("full_output", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Context Window</Label>
                    <p className="text-sm text-muted-foreground">
                      Respect LLM context limits
                    </p>
                  </div>
                  <Switch
                    checked={formData.respect_context_window}
                    onCheckedChange={(checked) =>
                      updateField("respect_context_window", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public</Label>
                    <p className="text-sm text-muted-foreground">
                      Make crew publicly visible
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      updateField("is_public", checked)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxRpm">Max RPM (Rate Limit)</Label>
                  <Input
                    id="maxRpm"
                    type="number"
                    placeholder="No limit"
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
                  <Label htmlFor="outputLog">Output Log File</Label>
                  <Input
                    id="outputLog"
                    placeholder="logs/crew_output.log"
                    value={formData.output_log_file}
                    onChange={(e) =>
                      updateField("output_log_file", e.target.value)
                    }
                  />
                </div>
              </div>

              {formData.planning && (
                <div className="space-y-2">
                  <Label htmlFor="planningLlm">Planning LLM</Label>
                  <Input
                    id="planningLlm"
                    placeholder="gpt-4"
                    value={formData.planning_llm}
                    onChange={(e) => updateField("planning_llm", e.target.value)}
                  />
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
          onClick={() => router.push("/crews")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Crew" : "Create Crew"}
        </Button>
      </div>
    </form>
  );
}
