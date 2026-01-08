"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { executionsApi } from "@/lib/api";
import {
  useExecutionWebSocket,
  ExecutionEvent,
} from "@/hooks/use-websocket";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Terminal,
  Activity,
  Play,
  StopCircle,
  RefreshCw,
  Wifi,
  DollarSign,
  Cpu,
  Timer,
  FileText,
} from "lucide-react";

interface Execution {
  id: string;
  execution_type: string;
  crew_id?: string;
  flow_id?: string;
  status: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  total_tokens?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  estimated_cost?: number;
  trigger_type?: string;
  environment?: string;
}

interface LogEntry {
  id: string;
  level: string;
  message: string;
  source?: string;
  source_type?: string;
  timestamp: string;
  data?: any;
}

interface Trace {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  operation_name: string;
  operation_type: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  status: string;
  error?: string;
  llm_model?: string;
  llm_provider?: string;
  tokens_used?: number;
  attributes?: Record<string, any>;
}

const statusConfig: Record<string, {
  icon: any;
  color: string;
  bg: string;
  label: string;
}> = {
  pending: {
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900",
    label: "Running",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900",
    label: "Failed",
  },
  cancelled: {
    icon: StopCircle,
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900",
    label: "Cancelled",
  },
  waiting_human: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900",
    label: "Waiting for Input",
  },
};

const logLevelColors: Record<string, string> = {
  debug: "text-gray-400",
  info: "text-blue-400",
  warning: "text-yellow-400",
  error: "text-red-400",
};

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.id as string;
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [execution, setExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [autoScroll, setAutoScroll] = useState(true);
  const [logLevelFilter, setLogLevelFilter] = useState<string | null>(null);

  // WebSocket for real-time updates
  const isRunning = execution?.status === "running";
  const ws = useExecutionWebSocket(isRunning ? executionId : null, {
    onMessage: (event) => {
      if (event.type === "log") {
        setLogs((prev) => [
          ...prev,
          {
            id: `ws-${Date.now()}`,
            level: event.level || "info",
            message: event.message || "",
            timestamp: new Date().toISOString(),
            source: event.source,
            source_type: event.source_type,
          },
        ]);
      } else if (event.type === "complete") {
        fetchExecution();
      } else if (event.type === "error") {
        fetchExecution();
      }
    },
  });

  const fetchExecution = useCallback(async () => {
    try {
      const response = await executionsApi.get(executionId);
      setExecution(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load execution");
    }
  }, [executionId]);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await executionsApi.getLogs(executionId, {
        level: logLevelFilter,
        limit: 500,
      });
      setLogs(response.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  }, [executionId, logLevelFilter]);

  const fetchTraces = useCallback(async () => {
    try {
      const response = await executionsApi.getTraces(executionId);
      setTraces(response.data || []);
    } catch (err) {
      console.error("Failed to fetch traces:", err);
    }
  }, [executionId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchExecution(), fetchLogs(), fetchTraces()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchExecution, fetchLogs, fetchTraces]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Poll for updates when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      fetchExecution();
      fetchLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, fetchExecution, fetchLogs]);

  const handleCancel = async () => {
    try {
      await executionsApi.cancel(executionId);
      await fetchExecution();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to cancel execution");
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return "-";
    return `$${cost.toFixed(4)}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Execution Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !execution) {
    return (
      <DashboardLayout title="Execution Details">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push("/executions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Executions
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[execution?.status || "pending"];
  const StatusIcon = status.icon;

  return (
    <DashboardLayout
      title="Execution Details"
      actions={
        <div className="flex items-center gap-2">
          {isRunning && ws.status === "connected" && (
            <Badge variant="outline">
              <Wifi className="h-3 w-3 mr-1 text-green-500" />
              Live
            </Badge>
          )}
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${status.bg}`}
          >
            <StatusIcon
              className={`h-4 w-4 ${status.color} ${
                execution?.status === "running" ? "animate-spin" : ""
              }`}
            />
            {status.label}
          </div>
          {isRunning && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              <StopCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/executions")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">
            Logs
            {logs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {logs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="traces">
            Traces
            {traces.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {traces.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {formatDuration(execution?.duration_ms)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {execution?.total_tokens?.toLocaleString() || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Estimated Cost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {formatCost(execution?.estimated_cost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold capitalize">
                    {execution?.execution_type || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Execution ID</span>
                  <span className="font-mono text-sm">{execution?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>
                    {execution?.started_at
                      ? new Date(execution.started_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>
                    {execution?.completed_at
                      ? new Date(execution.completed_at).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger</span>
                  <span className="capitalize">
                    {execution?.trigger_type || "manual"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="capitalize">
                    {execution?.environment || "development"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prompt Tokens</span>
                  <span>
                    {execution?.prompt_tokens?.toLocaleString() || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Completion Tokens
                  </span>
                  <span>
                    {execution?.completion_tokens?.toLocaleString() || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tokens</span>
                  <span className="font-bold">
                    {execution?.total_tokens?.toLocaleString() || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inputs */}
          {execution?.inputs && Object.keys(execution.inputs).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
                  {JSON.stringify(execution.inputs, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {execution?.error && (
            <Card className="mt-6 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-4">
                  {execution.error}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Execution Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={logLevelFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLogLevelFilter(null)}
                  >
                    All
                  </Button>
                  {["debug", "info", "warning", "error"].map((level) => (
                    <Button
                      key={level}
                      variant={logLevelFilter === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLogLevelFilter(level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoScroll(!autoScroll)}
                  >
                    {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={fetchLogs}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 text-zinc-100 rounded-lg p-4 font-mono text-sm max-h-[600px] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-zinc-500">No logs available</p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={log.id || idx} className="py-1 flex gap-2">
                      <span className="text-zinc-600 select-none shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={`shrink-0 uppercase ${
                          logLevelColors[log.level] || "text-zinc-400"
                        }`}
                      >
                        [{log.level}]
                      </span>
                      {log.source && (
                        <span className="text-purple-400 shrink-0">
                          [{log.source}]
                        </span>
                      )}
                      <span className="flex-1 break-words">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traces Tab */}
        <TabsContent value="traces">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Execution Traces
              </CardTitle>
              <CardDescription>
                Detailed timeline of operations during execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {traces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No traces available
                </div>
              ) : (
                <div className="space-y-4">
                  {traces.map((trace, idx) => (
                    <div
                      key={trace.id || idx}
                      className="relative pl-8 pb-4 border-l-2 border-muted last:border-0"
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary" />
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {trace.operation_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {trace.operation_type}
                            </Badge>
                            <Badge
                              variant={
                                trace.status === "ok"
                                  ? "success"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {trace.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(trace.duration_ms)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            Started:{" "}
                            {new Date(trace.start_time).toLocaleTimeString()}
                          </div>
                          {trace.llm_model && (
                            <div>
                              Model: {trace.llm_provider}/{trace.llm_model}
                            </div>
                          )}
                          {trace.tokens_used && (
                            <div>
                              Tokens: {trace.tokens_used.toLocaleString()}
                            </div>
                          )}
                          {trace.error && (
                            <div className="text-red-400">
                              Error: {trace.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Output Tab */}
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Execution Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              {execution?.outputs ? (
                <div className="space-y-4">
                  {execution.outputs.raw && (
                    <div>
                      <h4 className="font-medium mb-2">Result</h4>
                      <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap">
                        {execution.outputs.raw}
                      </div>
                    </div>
                  )}
                  {execution.outputs.tasks_output &&
                    execution.outputs.tasks_output.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Task Outputs</h4>
                        <div className="space-y-2">
                          {execution.outputs.tasks_output.map(
                            (task: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-muted rounded-lg p-4"
                              >
                                <div className="text-sm text-muted-foreground mb-1">
                                  {task.description}
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {task.raw}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  {!execution.outputs.raw &&
                    !execution.outputs.tasks_output && (
                      <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
                        {JSON.stringify(execution.outputs, null, 2)}
                      </pre>
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {execution?.status === "running"
                    ? "Execution in progress..."
                    : "No output available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
