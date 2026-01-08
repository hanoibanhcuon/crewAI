"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { triggersApi, crewsApi, flowsApi } from "@/lib/api";
import {
  InputMappingEditor,
  mappingsToRecord,
  recordToMappings,
} from "@/components/triggers/input-mapping-editor";
import {
  Plus,
  Search,
  Webhook,
  Clock,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  Play,
  Pause,
  Loader2,
  Zap,
  Calendar,
  Link as LinkIcon,
  Settings2,
  ArrowRight,
} from "lucide-react";

interface Trigger {
  id: string;
  name: string;
  description?: string;
  trigger_type: "webhook" | "schedule" | "event";
  target_type: "crew" | "flow";
  target_id: string;
  target_name?: string;
  is_active: boolean;
  config: {
    webhook_url?: string;
    webhook_secret?: string;
    schedule?: string;
    event_type?: string;
  };
  input_mapping?: Record<string, string>;
  last_triggered_at?: string;
  trigger_count?: number;
}

const triggerTypeConfig = {
  webhook: {
    icon: Webhook,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900",
    label: "Webhook",
  },
  schedule: {
    icon: Clock,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900",
    label: "Schedule",
  },
  event: {
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900",
    label: "Event",
  },
};

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "webhook",
    target_type: "crew",
    target_id: "",
    schedule: "",
    event_type: "",
  });
  const [inputMappings, setInputMappings] = useState<
    { targetKey: string; sourcePath: string; defaultValue?: string; transform?: string }[]
  >([]);

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    schedule: "",
    event_type: "",
  });
  const [editInputMappings, setEditInputMappings] = useState<
    { targetKey: string; sourcePath: string; defaultValue?: string; transform?: string }[]
  >([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [triggersRes, crewsRes, flowsRes] = await Promise.all([
        triggersApi.list(),
        crewsApi.list(),
        flowsApi.list(),
      ]);
      setTriggers(triggersRes.data?.items || triggersRes.data || []);
      setCrews(crewsRes.data?.items || []);
      setFlows(flowsRes.data?.items || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      // Use mock data for demo
      setTriggers([
        {
          id: "1",
          name: "GitHub Push Webhook",
          description: "Trigger on GitHub push events",
          trigger_type: "webhook",
          target_type: "crew",
          target_id: "crew-1",
          target_name: "Code Review Crew",
          is_active: true,
          config: {
            webhook_url:
              "https://api.crewai.local/webhooks/abc123",
          },
          trigger_count: 45,
          last_triggered_at: "2025-01-08T10:30:00Z",
        },
        {
          id: "2",
          name: "Daily Report Schedule",
          description: "Generate daily reports at 9 AM",
          trigger_type: "schedule",
          target_type: "crew",
          target_id: "crew-2",
          target_name: "Report Generator Crew",
          is_active: true,
          config: {
            schedule: "0 9 * * *",
          },
          trigger_count: 30,
          last_triggered_at: "2025-01-08T09:00:00Z",
        },
        {
          id: "3",
          name: "New User Event",
          description: "Trigger on new user registration",
          trigger_type: "event",
          target_type: "flow",
          target_id: "flow-1",
          target_name: "Onboarding Flow",
          is_active: false,
          config: {
            event_type: "user.created",
          },
          trigger_count: 120,
          last_triggered_at: "2025-01-07T15:45:00Z",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const config: Record<string, string> = {};
      if (formData.trigger_type === "schedule") {
        config.schedule = formData.schedule;
      } else if (formData.trigger_type === "event") {
        config.event_type = formData.event_type;
      }

      // Convert input mappings to record format
      const input_mapping = mappingsToRecord(inputMappings);

      await triggersApi.create({
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        target_type: formData.target_type,
        target_id: formData.target_id,
        config,
        input_mapping,
      });

      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        trigger_type: "webhook",
        target_type: "crew",
        target_id: "",
        schedule: "",
        event_type: "",
      });
      setInputMappings([]);
      loadData();
    } catch (err) {
      console.error("Failed to create trigger:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (trigger: Trigger) => {
    setEditingTrigger(trigger);
    setEditFormData({
      name: trigger.name,
      description: trigger.description || "",
      schedule: trigger.config?.schedule || "",
      event_type: trigger.config?.event_type || "",
    });
    setEditInputMappings(recordToMappings(trigger.input_mapping));
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTrigger) return;
    setIsUpdating(true);
    try {
      const config: Record<string, string> = { ...editingTrigger.config };
      if (editingTrigger.trigger_type === "schedule") {
        config.schedule = editFormData.schedule;
      } else if (editingTrigger.trigger_type === "event") {
        config.event_type = editFormData.event_type;
      }

      const input_mapping = mappingsToRecord(editInputMappings);

      await triggersApi.update(editingTrigger.id, {
        name: editFormData.name,
        description: editFormData.description,
        config,
        input_mapping,
      });

      setIsEditOpen(false);
      setEditingTrigger(null);
      loadData();
    } catch (err) {
      console.error("Failed to update trigger:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = async (triggerId: string, isActive: boolean) => {
    try {
      await triggersApi.update(triggerId, { is_active: isActive });
      setTriggers((prev) =>
        prev.map((t) => (t.id === triggerId ? { ...t, is_active: isActive } : t))
      );
    } catch (err) {
      console.error("Failed to toggle trigger:", err);
    }
  };

  const handleDelete = async (triggerId: string) => {
    if (!confirm("Are you sure you want to delete this trigger?")) return;

    try {
      await triggersApi.delete(triggerId);
      setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
    } catch (err) {
      console.error("Failed to delete trigger:", err);
    }
  };

  const filteredTriggers = triggers.filter(
    (trigger) =>
      trigger.name.toLowerCase().includes(search.toLowerCase()) ||
      trigger.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Triggers">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Triggers"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Trigger</DialogTitle>
              <DialogDescription>
                Set up automated execution triggers for your crews and flows.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="mapping">
                  <Settings2 className="h-4 w-4 mr-1" />
                  Input Mapping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My Trigger"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Trigger description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, trigger_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="schedule">Schedule</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Type</Label>
                    <Select
                      value={formData.target_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          target_type: value,
                          target_id: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crew">Crew</SelectItem>
                        <SelectItem value="flow">Flow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select
                    value={formData.target_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, target_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.target_type === "crew"
                        ? crews.map((crew) => (
                            <SelectItem key={crew.id} value={crew.id}>
                              {crew.name}
                            </SelectItem>
                          ))
                        : flows.map((flow) => (
                            <SelectItem key={flow.id} value={flow.id}>
                              {flow.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.trigger_type === "schedule" && (
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input
                      value={formData.schedule}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule: e.target.value })
                      }
                      placeholder="0 9 * * *"
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "0 9 * * *" runs daily at 9 AM
                    </p>
                  </div>
                )}

                {formData.trigger_type === "event" && (
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Input
                      value={formData.event_type}
                      onChange={(e) =>
                        setFormData({ ...formData, event_type: e.target.value })
                      }
                      placeholder="user.created"
                    />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="mapping" className="mt-4">
                <InputMappingEditor
                  mappings={inputMappings}
                  onChange={setInputMappings}
                  triggerType={formData.trigger_type}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Trigger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Triggers List */}
      <div className="space-y-4">
        {filteredTriggers.map((trigger) => {
          const typeConfig =
            triggerTypeConfig[
              trigger.trigger_type as keyof typeof triggerTypeConfig
            ];
          const TypeIcon = typeConfig.icon;

          return (
            <Card key={trigger.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${typeConfig.bg}`}
                    >
                      <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{trigger.name}</h3>
                        <Badge variant="outline">{typeConfig.label}</Badge>
                        {trigger.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {trigger.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {trigger.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Target: {trigger.target_name || trigger.target_id}
                        </span>
                        {trigger.trigger_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {trigger.trigger_count} executions
                          </span>
                        )}
                        {trigger.last_triggered_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last:{" "}
                            {new Date(
                              trigger.last_triggered_at
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Trigger-specific info */}
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        {trigger.trigger_type === "webhook" &&
                          trigger.config.webhook_url && (
                            <div className="flex items-center gap-2">
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                              <code className="text-xs">
                                {trigger.config.webhook_url}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    trigger.config.webhook_url || ""
                                  )
                                }
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        {trigger.trigger_type === "schedule" &&
                          trigger.config.schedule && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <code className="text-xs">
                                {trigger.config.schedule}
                              </code>
                            </div>
                          )}
                        {trigger.trigger_type === "event" &&
                          trigger.config.event_type && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <code className="text-xs">
                                {trigger.config.event_type}
                              </code>
                            </div>
                          )}
                        {/* Input Mapping Info */}
                        {trigger.input_mapping &&
                          Object.keys(trigger.input_mapping).length > 0 && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-muted">
                              <Settings2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {Object.keys(trigger.input_mapping).length} input
                                mapping(s) configured
                              </span>
                              <div className="flex gap-1">
                                {Object.entries(trigger.input_mapping)
                                  .slice(0, 2)
                                  .map(([key, path]) => (
                                    <Badge
                                      key={key}
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {path as string} <ArrowRight className="h-2 w-2 mx-1" />{" "}
                                      {key}
                                    </Badge>
                                  ))}
                                {Object.keys(trigger.input_mapping).length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{Object.keys(trigger.input_mapping).length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={trigger.is_active}
                      onCheckedChange={(checked) =>
                        handleToggle(trigger.id, checked)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(trigger)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(trigger.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTriggers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No triggers found</h3>
          <p className="text-muted-foreground">
            Create triggers to automate crew and flow execution
          </p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Trigger
          </Button>
        </div>
      )}

      {/* Edit Trigger Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Trigger</DialogTitle>
            <DialogDescription>
              Update trigger settings and input mappings.
            </DialogDescription>
          </DialogHeader>
          {editingTrigger && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="mapping">
                  <Settings2 className="h-4 w-4 mr-1" />
                  Input Mapping
                </TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    placeholder="Trigger name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Trigger description..."
                    rows={2}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">
                      {triggerTypeConfig[
                        editingTrigger.trigger_type as keyof typeof triggerTypeConfig
                      ]?.label || editingTrigger.trigger_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Target:</span>
                    <Badge variant="secondary">
                      {editingTrigger.target_name || editingTrigger.target_id}
                    </Badge>
                  </div>
                </div>

                {editingTrigger.trigger_type === "schedule" && (
                  <div className="space-y-2">
                    <Label>Cron Expression</Label>
                    <Input
                      value={editFormData.schedule}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          schedule: e.target.value,
                        })
                      }
                      placeholder="0 9 * * *"
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "0 9 * * *" runs daily at 9 AM
                    </p>
                  </div>
                )}

                {editingTrigger.trigger_type === "event" && (
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Input
                      value={editFormData.event_type}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          event_type: e.target.value,
                        })
                      }
                      placeholder="user.created"
                    />
                  </div>
                )}

                {editingTrigger.trigger_type === "webhook" &&
                  editingTrigger.config?.webhook_url && (
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <code className="text-xs flex-1 truncate">
                          {editingTrigger.config.webhook_url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              editingTrigger.config?.webhook_url || ""
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
              </TabsContent>
              <TabsContent value="mapping" className="mt-4">
                <InputMappingEditor
                  mappings={editInputMappings}
                  onChange={setEditInputMappings}
                  triggerType={editingTrigger.trigger_type}
                />
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
