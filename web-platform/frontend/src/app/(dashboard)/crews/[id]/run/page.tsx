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
import { crewsApi, executionsApi } from "@/lib/api";
import {
  useCrewWebSocket,
  ExecutionEvent,
} from "@/hooks/use-websocket";
import {
  Loader2,
  Play,
  StopCircle,
  Bot,
  ListTodo,
  CheckCircle,
  XCircle,
  Clock,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

interface InputField {
  name: string;
  type: string;
  required: boolean;
  default?: any;
}

export default function CrewRunPage() {
  const params = useParams();
  const router = useRouter();
  const crewId = params.id as string;
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [crew, setCrew] = useState<any>(null);
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionStatus, setExecutionStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const [crewRes, inputsRes] = await Promise.all([
          crewsApi.get(crewId),
          crewsApi.getInputs(crewId),
        ]);
        setCrew(crewRes.data);

        // Parse input fields from crew
        const fields: InputField[] = inputsRes.data || [];
        setInputFields(fields);

        // Initialize inputs with defaults
        const defaultInputs: Record<string, any> = {};
        fields.forEach((field: InputField) => {
          if (field.default !== undefined) {
            defaultInputs[field.name] = field.default;
          } else {
            defaultInputs[field.name] = "";
          }
        });
        setInputs(defaultInputs);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load crew");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrew();
  }, [crewId]);

  useEffect(() => {
    // Poll for execution updates when running
    if (!executionId || !isRunning) return;

    const pollExecution = async () => {
      try {
        const response = await executionsApi.get(executionId);
        const execution = response.data;

        setExecutionStatus(execution.status);

        // Get logs
        const logsRes = await executionsApi.getLogs(executionId);
        if (logsRes.data && logsRes.data.length > 0) {
          setLogs(logsRes.data.map((l: any) => l.message || l));
        }

        // Check if completed
        if (["completed", "failed", "cancelled"].includes(execution.status)) {
          setIsRunning(false);
          if (execution.status === "completed") {
            setResult(execution.result);
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
  }, [executionId, isRunning]);

  useEffect(() => {
    // Auto scroll logs
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleInputChange = (name: string, value: any) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleRun = async () => {
    setError("");
    setResult(null);
    setLogs([]);
    setIsRunning(true);
    setExecutionStatus("pending");

    try {
      const response = await crewsApi.kickoff(crewId, inputs);
      setExecutionId(response.data.execution_id);
      setExecutionStatus("running");
      setLogs(["Crew execution started..."]);
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
      setLogs((prev) => [...prev, "Execution cancelled by user"]);
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
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Run Crew">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !crew) {
    return (
      <DashboardLayout title="Run Crew">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/crews")}
            className="text-primary hover:underline"
          >
            Back to Crews
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Run: ${crew?.name}`}
      actions={
        <div className="flex items-center gap-2">
          {executionStatus && getStatusBadge(executionStatus)}
          <Button
            variant="outline"
            onClick={() => router.push(`/crews/${crewId}`)}
          >
            Edit Crew
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crew Overview</CardTitle>
              <CardDescription>{crew?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Agents</h4>
                <div className="space-y-2">
                  {crew?.agents?.map((agent: any, idx: number) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Bot className="h-4 w-4 text-primary" />
                      <span>
                        {idx + 1}. {agent.agent_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Tasks</h4>
                <div className="space-y-2">
                  {crew?.tasks?.map((task: any, idx: number) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <ListTodo className="h-4 w-4" />
                      <span>
                        {idx + 1}. {task.task_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Input Variables</CardTitle>
              <CardDescription>
                Provide values for crew execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No input variables required
                </p>
              ) : (
                inputFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.name}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {field.type === "text" || field.type === "string" ? (
                      <Textarea
                        id={field.name}
                        placeholder={`Enter ${field.name}...`}
                        value={inputs[field.name] || ""}
                        onChange={(e) =>
                          handleInputChange(field.name, e.target.value)
                        }
                        disabled={isRunning}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type === "number" ? "number" : "text"}
                        placeholder={`Enter ${field.name}...`}
                        value={inputs[field.name] || ""}
                        onChange={(e) =>
                          handleInputChange(field.name, e.target.value)
                        }
                        disabled={isRunning}
                      />
                    )}
                  </div>
                ))
              )}

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
                    Run Crew
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-zinc-950 text-zinc-100 rounded-lg p-4 font-mono text-sm max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-zinc-500">
                    Logs will appear here when you run the crew...
                  </p>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="py-0.5">
                      <span className="text-zinc-500 mr-2">
                        [{String(idx + 1).padStart(3, "0")}]
                      </span>
                      {log}
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
                  {typeof result === "string" ? (
                    <div className="whitespace-pre-wrap">{result}</div>
                  ) : (
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
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
