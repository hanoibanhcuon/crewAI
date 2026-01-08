"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { flowsApi, executionsApi } from "@/lib/api";
import {
  useExecutionWebSocket,
  ExecutionEvent,
} from "@/hooks/use-websocket";
import {
  Loader2,
  Play,
  StopCircle,
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
  ArrowRight,
} from "lucide-react";

interface LogEntry {
  timestamp: number;
  type: string;
  message: string;
  data?: any;
}

export default function FlowRunPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [flow, setFlow] = useState<any>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [initialState, setInitialState] = useState<string>("{}");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string>("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  // WebSocket for execution monitoring
  const ws = useExecutionWebSocket(
    useWebSocket && executionId && isRunning ? executionId : null,
    {
      onMessage: handleWebSocketEvent,
    }
  );

  function handleWebSocketEvent(event: ExecutionEvent) {
    const timestamp = Date.now();
    const logEntry: LogEntry = {
      timestamp,
      type: event.type,
      message: getEventMessage(event),
      data: event,
    };

    setLogs((prev) => [...prev, logEntry]);

    switch (event.type) {
      case "start":
        setExecutionStatus("running");
        setProgress(5);
        break;
      case "flow_loaded":
        setProgress(10);
        break;
      case "step_start":
        setCurrentStep(event.step_name);
        break;
      case "step_complete":
        setCurrentStep(null);
        break;
      case "complete":
        setIsRunning(false);
        setExecutionStatus("completed");
        setResult(event.output);
        setProgress(100);
        break;
      case "error":
        setIsRunning(false);
        setExecutionStatus("failed");
        setError(event.message || "Execution failed");
        break;
      case "cancelled":
        setIsRunning(false);
        setExecutionStatus("cancelled");
        break;
      case "human_input_required":
        setExecutionStatus("waiting_human");
        break;
    }
  }

  function getEventMessage(event: ExecutionEvent): string {
    switch (event.type) {
      case "connected":
        return `Connected to execution ${event.execution_id}`;
      case "start":
        return "Flow execution started";
      case "flow_loaded":
        return `Loaded flow "${event.flow_name}" with ${event.steps_count} steps`;
      case "step_start":
        return `Step started: ${event.step_name} (${event.step_type})`;
      case "step_complete":
        return `Step completed: ${event.step_name}`;
      case "complete":
        return `Flow completed in ${event.metrics?.duration_ms || 0}ms`;
      case "error":
        return `Error: ${event.message}`;
      case "cancelled":
        return "Flow cancelled";
      case "human_input_required":
        return `Human input required: ${event.prompt}`;
      default:
        return event.message || JSON.stringify(event);
    }
  }

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const flowRes = await flowsApi.get(flowId);
        setFlow(flowRes.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load flow");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlow();
  }, [flowId]);

  // Fallback polling when not using WebSocket
  useEffect(() => {
    if (useWebSocket || !executionId || !isRunning) return;

    const pollExecution = async () => {
      try {
        const response = await executionsApi.get(executionId);
        const execution = response.data;

        setExecutionStatus(execution.status);

        const logsRes = await executionsApi.getLogs(executionId);
        if (logsRes.data && logsRes.data.length > 0) {
          setLogs(
            logsRes.data.map((l: any) => ({
              timestamp: new Date(l.timestamp || Date.now()).getTime(),
              type: l.level || "info",
              message: l.message || String(l),
              data: l,
            }))
          );
        }

        if (["completed", "failed", "cancelled"].includes(execution.status)) {
          setIsRunning(false);
          if (execution.status === "completed") {
            setResult(execution.outputs);
          } else if (execution.status === "failed") {
            setError(execution.error || "Execution failed");
          }
        }
      } catch (err) {
        console.error("Failed to poll execution:", err);
      }
    };

    const interval = setInterval(pollExecution, 2000);
    return () => clearInterval(interval);
  }, [executionId, isRunning, useWebSocket]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleRun = async () => {
    setError("");
    setResult(null);
    setLogs([]);
    setIsRunning(true);
    setExecutionStatus("pending");
    setProgress(0);

    try {
      let parsedState = {};
      try {
        parsedState = JSON.parse(initialState);
      } catch {
        // Ignore parse errors, use empty object
      }

      const response = await flowsApi.kickoff(flowId, inputs, parsedState);
      setExecutionId(response.data.execution_id);
      setExecutionStatus("running");
      setLogs([
        {
          timestamp: Date.now(),
          type: "info",
          message: "Flow execution started...",
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start execution");
      setIsRunning(false);
    }
  };

  const handleCancel = async () => {
    if (!executionId) return;

    try {
      await executionsApi.cancel(executionId);
      setIsRunning(false);
      setExecutionStatus("cancelled");
      setLogs((prev) => [
        ...prev,
        {
          timestamp: Date.now(),
          type: "warning",
          message: "Execution cancelled by user",
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to cancel execution");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "running":
        return (
          <Badge variant="default">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="warning">
            <StopCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "waiting_human":
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3 mr-1" />
            Waiting Input
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "complete":
        return "text-green-400";
      case "step_start":
        return "text-blue-400";
      case "step_complete":
        return "text-purple-400";
      default:
        return "text-zinc-300";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Run Flow">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !flow) {
    return (
      <DashboardLayout title="Run Flow">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/flows")}
            className="text-primary hover:underline"
          >
            Back to Flows
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Run: ${flow?.name}`}
      actions={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {useWebSocket ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="ws-toggle" className="text-sm">
              Real-time
            </Label>
            <Switch
              id="ws-toggle"
              checked={useWebSocket}
              onCheckedChange={setUseWebSocket}
              disabled={isRunning}
            />
          </div>
          {executionStatus && getStatusBadge(executionStatus)}
          <Button
            variant="outline"
            onClick={() => router.push(`/flows/${flowId}/edit`)}
          >
            Edit Flow
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Flow Overview
              </CardTitle>
              <CardDescription>{flow?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Steps</h4>
                <div className="space-y-2">
                  {flow?.steps?.map((step: any, idx: number) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        currentStep === step.name
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted/50"
                      }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-xs">
                        {idx + 1}
                      </span>
                      <span>{step.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {step.step_type}
                      </Badge>
                      {currentStep === step.name && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
              <CardDescription>
                Configure flow inputs and initial state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Initial State (JSON)</Label>
                <Textarea
                  value={initialState}
                  onChange={(e) => setInitialState(e.target.value)}
                  placeholder='{"key": "value"}'
                  disabled={isRunning}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                {isRunning ? (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                ) : (
                  <Button onClick={handleRun} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Run Flow
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress Bar */}
          {isRunning && progress > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                {currentStep && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Currently executing: {currentStep}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Execution Logs
                {useWebSocket && isRunning && (
                  <Badge variant="outline" className="ml-2">
                    <Wifi className="h-3 w-3 mr-1 text-green-500" />
                    Live
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 text-zinc-100 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-zinc-500">
                    Logs will appear here when you run the flow...
                  </p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="py-0.5 flex">
                      <span className="text-zinc-600 mr-2 select-none">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`${getLogTypeColor(log.type)} mr-2`}>
                        [{log.type}]
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && executionId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <XCircle className="h-5 w-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-4">
                  {error}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
