"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ListTodo,
  Layers,
  GitBranch,
  Play,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Wrench,
  Database,
  Zap,
  Store,
  Activity,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

// Widget definitions
interface Widget {
  id: string;
  name: string;
  description: string;
  icon: any;
  defaultVisible: boolean;
  size: "small" | "medium" | "large";
}

const availableWidgets: Widget[] = [
  {
    id: "stats",
    name: "Statistics",
    description: "Overview of agents, tasks, crews, and flows",
    icon: Activity,
    defaultVisible: true,
    size: "large",
  },
  {
    id: "executions",
    name: "Recent Executions",
    description: "Latest crew and flow executions",
    icon: Play,
    defaultVisible: true,
    size: "medium",
  },
  {
    id: "quickActions",
    name: "Quick Actions",
    description: "Create resources quickly",
    icon: TrendingUp,
    defaultVisible: true,
    size: "medium",
  },
  {
    id: "gettingStarted",
    name: "Getting Started",
    description: "Guide to get started with CrewAI",
    icon: CheckCircle,
    defaultVisible: true,
    size: "large",
  },
  {
    id: "usageStats",
    name: "Usage Statistics",
    description: "Token usage and costs overview",
    icon: DollarSign,
    defaultVisible: false,
    size: "medium",
  },
  {
    id: "recentTools",
    name: "Recent Tools",
    description: "Recently used tools",
    icon: Wrench,
    defaultVisible: false,
    size: "small",
  },
  {
    id: "knowledgeBases",
    name: "Knowledge Bases",
    description: "Your knowledge sources",
    icon: Database,
    defaultVisible: false,
    size: "small",
  },
  {
    id: "triggers",
    name: "Active Triggers",
    description: "Currently active triggers",
    icon: Zap,
    defaultVisible: false,
    size: "small",
  },
];

const defaultWidgetOrder = availableWidgets.map((w) => w.id);
const defaultVisibleWidgets = availableWidgets
  .filter((w) => w.defaultVisible)
  .map((w) => w.id);

// Mock data
const stats = [
  {
    name: "Total Agents",
    value: "12",
    change: "+2 this week",
    icon: Users,
    href: "/agents",
  },
  {
    name: "Total Tasks",
    value: "28",
    change: "+5 this week",
    icon: ListTodo,
    href: "/tasks",
  },
  {
    name: "Active Crews",
    value: "6",
    change: "+1 this week",
    icon: Layers,
    href: "/crews",
  },
  {
    name: "Flows",
    value: "4",
    change: "No change",
    icon: GitBranch,
    href: "/flows",
  },
];

const recentExecutions = [
  {
    id: "1",
    name: "Research Crew",
    status: "completed",
    duration: "2m 34s",
    timestamp: "5 min ago",
  },
  {
    id: "2",
    name: "Content Writing Flow",
    status: "running",
    duration: "1m 12s",
    timestamp: "Running",
  },
  {
    id: "3",
    name: "Data Analysis Crew",
    status: "failed",
    duration: "45s",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    name: "Customer Support Agent",
    status: "completed",
    duration: "3m 21s",
    timestamp: "2 hours ago",
  },
];

const quickActions = [
  { name: "New Agent", icon: Users, href: "/agents/new" },
  { name: "New Task", icon: ListTodo, href: "/tasks/new" },
  { name: "New Crew", icon: Layers, href: "/crews/new" },
  { name: "New Flow", icon: GitBranch, href: "/flows/new/edit" },
];

const usageStats = {
  totalTokens: "1.2M",
  estimatedCost: "$12.45",
  apiCalls: "3,456",
  avgResponseTime: "2.3s",
};

const recentTools = [
  { name: "Web Search", usage: 156 },
  { name: "File Reader", usage: 89 },
  { name: "Code Executor", usage: 45 },
];

const knowledgeBases = [
  { name: "Product Docs", chunks: 156, status: "ready" },
  { name: "API Reference", chunks: 89, status: "ready" },
  { name: "FAQ", chunks: 34, status: "processing" },
];

const activeTriggers = [
  { name: "Daily Report", type: "schedule", nextRun: "Tomorrow 9:00 AM" },
  { name: "GitHub PR", type: "webhook", active: true },
  { name: "Email Alert", type: "email", active: true },
];

export default function DashboardPage() {
  const [showCustomize, setShowCustomize] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(
    defaultVisibleWidgets
  );
  const [widgetOrder, setWidgetOrder] = useState<string[]>(defaultWidgetOrder);

  // Load preferences from localStorage
  useEffect(() => {
    const savedVisible = localStorage.getItem("dashboard_visible_widgets");
    const savedOrder = localStorage.getItem("dashboard_widget_order");

    if (savedVisible) {
      try {
        setVisibleWidgets(JSON.parse(savedVisible));
      } catch (e) {
        console.error("Failed to parse visible widgets:", e);
      }
    }

    if (savedOrder) {
      try {
        setWidgetOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to parse widget order:", e);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = (visible: string[], order: string[]) => {
    localStorage.setItem("dashboard_visible_widgets", JSON.stringify(visible));
    localStorage.setItem("dashboard_widget_order", JSON.stringify(order));
  };

  const toggleWidget = (widgetId: string) => {
    const newVisible = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter((id) => id !== widgetId)
      : [...visibleWidgets, widgetId];
    setVisibleWidgets(newVisible);
    savePreferences(newVisible, widgetOrder);
  };

  const moveWidget = (widgetId: string, direction: "up" | "down") => {
    const currentIndex = widgetOrder.indexOf(widgetId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === widgetOrder.length - 1)
    ) {
      return;
    }

    const newOrder = [...widgetOrder];
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[currentIndex],
    ];
    setWidgetOrder(newOrder);
    savePreferences(visibleWidgets, newOrder);
  };

  const resetToDefault = () => {
    setVisibleWidgets(defaultVisibleWidgets);
    setWidgetOrder(defaultWidgetOrder);
    savePreferences(defaultVisibleWidgets, defaultWidgetOrder);
  };

  const isWidgetVisible = (widgetId: string) =>
    visibleWidgets.includes(widgetId);

  // Render individual widgets
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case "stats":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link key={stat.name} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.name}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        );

      case "executions":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Recent Executions
              </CardTitle>
              <CardDescription>
                Your latest crew and flow executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {execution.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {execution.status === "running" && (
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                      )}
                      {execution.status === "failed" && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{execution.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {execution.duration}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {execution.timestamp}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/executions">View All Executions</Link>
              </Button>
            </CardContent>
          </Card>
        );

      case "quickActions":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Create new resources quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.name} href={action.href}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <action.icon className="h-8 w-8 text-primary mb-2" />
                        <span className="font-medium text-center">
                          {action.name}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case "gettingStarted":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with CrewAI</CardTitle>
              <CardDescription>
                Follow these steps to build your first AI agent team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Create Agents</h4>
                    <p className="text-sm text-muted-foreground">
                      Define AI agents with roles, goals, and tools
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Create Tasks</h4>
                    <p className="text-sm text-muted-foreground">
                      Define tasks with descriptions and expected outputs
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-lg border p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Build Crews</h4>
                    <p className="text-sm text-muted-foreground">
                      Combine agents and tasks into powerful crews
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "usageStats":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
              <CardDescription>Token usage and costs this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold">{usageStats.totalTokens}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Est. Cost</p>
                  <p className="text-2xl font-bold">{usageStats.estimatedCost}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">API Calls</p>
                  <p className="text-2xl font-bold">{usageStats.apiCalls}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{usageStats.avgResponseTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "recentTools":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="h-4 w-4" />
                Recent Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{tool.name}</span>
                    <Badge variant="secondary">{tool.usage} uses</Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/tools">View All Tools</Link>
              </Button>
            </CardContent>
          </Card>
        );

      case "knowledgeBases":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Knowledge Bases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {knowledgeBases.map((kb) => (
                  <div
                    key={kb.name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">{kb.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {kb.chunks} chunks
                      </p>
                    </div>
                    <Badge
                      variant={kb.status === "ready" ? "default" : "secondary"}
                    >
                      {kb.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/knowledge">Manage Knowledge</Link>
              </Button>
            </CardContent>
          </Card>
        );

      case "triggers":
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                Active Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTriggers.map((trigger) => (
                  <div
                    key={trigger.name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-medium">{trigger.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {trigger.type}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {trigger.nextRun || (trigger.active ? "Active" : "Inactive")}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link href="/triggers">Manage Triggers</Link>
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Sort widgets by order
  const sortedWidgets = [...widgetOrder].filter((id) =>
    availableWidgets.find((w) => w.id === id)
  );

  // Separate widgets by size for layout
  const largeWidgets = sortedWidgets.filter(
    (id) =>
      isWidgetVisible(id) &&
      availableWidgets.find((w) => w.id === id)?.size === "large"
  );
  const mediumWidgets = sortedWidgets.filter(
    (id) =>
      isWidgetVisible(id) &&
      availableWidgets.find((w) => w.id === id)?.size === "medium"
  );
  const smallWidgets = sortedWidgets.filter(
    (id) =>
      isWidgetVisible(id) &&
      availableWidgets.find((w) => w.id === id)?.size === "small"
  );

  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowCustomize(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Customize
          </Button>
          <Button asChild>
            <Link href="/crews/new">
              <Plus className="mr-2 h-4 w-4" />
              New Crew
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Large widgets */}
        {largeWidgets.map((widgetId) => (
          <div key={widgetId}>{renderWidget(widgetId)}</div>
        ))}

        {/* Medium widgets in 2 columns */}
        {mediumWidgets.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {mediumWidgets.map((widgetId) => (
              <div key={widgetId}>{renderWidget(widgetId)}</div>
            ))}
          </div>
        )}

        {/* Small widgets in 3 columns */}
        {smallWidgets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {smallWidgets.map((widgetId) => (
              <div key={widgetId}>{renderWidget(widgetId)}</div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {visibleWidgets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No widgets visible</h3>
              <p className="text-muted-foreground mb-4">
                Click Customize to add widgets to your dashboard
              </p>
              <Button onClick={() => setShowCustomize(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Customize Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customize Dialog */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Customize Dashboard
            </DialogTitle>
            <DialogDescription>
              Choose which widgets to display and their order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {widgetOrder.map((widgetId, index) => {
              const widget = availableWidgets.find((w) => w.id === widgetId);
              if (!widget) return null;
              const isVisible = isWidgetVisible(widgetId);
              const Icon = widget.icon;

              return (
                <div
                  key={widgetId}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isVisible ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widgetId, "up")}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveWidget(widgetId, "down")}
                      disabled={index === widgetOrder.length - 1}
                    >
                      <GripVertical className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{widget.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {widget.description}
                    </p>
                  </div>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => toggleWidget(widgetId)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={resetToDefault}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Default
            </Button>
            <Button onClick={() => setShowCustomize(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
