"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toolsApi } from "@/lib/api";

interface ToolTestSandboxProps {
  toolId?: string;
  argsSchema?: object;
  customCode?: string;
  onTest?: (input: object) => Promise<any>;
}

interface TestResult {
  success: boolean;
  output?: any;
  error?: string;
  duration_ms?: number;
  timestamp: Date;
}

export function ToolTestSandbox({
  toolId,
  argsSchema,
  customCode,
  onTest,
}: ToolTestSandboxProps) {
  const [testInput, setTestInput] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleTest = async () => {
    setIsRunning(true);
    const startTime = Date.now();

    try {
      let parsedInput = {};
      try {
        parsedInput = JSON.parse(testInput);
      } catch {
        setResults((prev) => [
          {
            success: false,
            error: "Invalid JSON input",
            timestamp: new Date(),
          },
          ...prev,
        ]);
        return;
      }

      let result: any;

      if (onTest) {
        // Use custom test function
        result = await onTest(parsedInput);
      } else if (toolId) {
        // Test via API
        const response = await toolsApi.test(toolId, parsedInput);
        result = response.data.result;
      } else {
        // No way to test
        setResults((prev) => [
          {
            success: false,
            error: "No tool ID or test function provided",
            timestamp: new Date(),
          },
          ...prev,
        ]);
        return;
      }

      const duration = Date.now() - startTime;

      setResults((prev) => [
        {
          success: true,
          output: result,
          duration_ms: duration,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      setResults((prev) => [
        {
          success: false,
          error: err.response?.data?.detail || err.message || "Test failed",
          duration_ms: duration,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const generateSampleInput = () => {
    if (!argsSchema || !(argsSchema as any).properties) {
      setTestInput("{}");
      return;
    }

    const properties = (argsSchema as any).properties;
    const sample: Record<string, unknown> = {};

    for (const [key, prop] of Object.entries<any>(properties)) {
      if (prop.default !== undefined) {
        sample[key] = prop.default;
      } else if (prop.enum && prop.enum.length > 0) {
        sample[key] = prop.enum[0];
      } else {
        switch (prop.type) {
          case "string":
            sample[key] = `sample_${key}`;
            break;
          case "integer":
            sample[key] = 0;
            break;
          case "number":
            sample[key] = 0.0;
            break;
          case "boolean":
            sample[key] = false;
            break;
          case "array":
            sample[key] = [];
            break;
          case "object":
            sample[key] = {};
            break;
          default:
            sample[key] = null;
        }
      }
    }

    setTestInput(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Test Input</CardTitle>
              <CardDescription className="text-xs">
                Enter JSON input to test your tool
              </CardDescription>
            </div>
            {argsSchema && (
              <Button
                variant="outline"
                size="sm"
                onClick={generateSampleInput}
              >
                Generate Sample
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="font-mono text-sm min-h-[120px]"
            placeholder='{"arg1": "value1", "arg2": 123}'
          />
          <Button onClick={handleTest} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Test Results</CardTitle>
            <CardDescription className="text-xs">
              {results.length} test(s) executed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <Badge
                      variant={result.success ? "success" : "destructive"}
                      className="text-xs"
                    >
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                    {result.duration_ms !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {result.duration_ms}ms
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {result.success && result.output !== undefined && (
                  <div className="mt-2">
                    <Label className="text-xs font-medium">Output:</Label>
                    <pre className="mt-1 p-2 bg-background rounded text-xs font-mono overflow-x-auto max-h-40">
                      {typeof result.output === "string"
                        ? result.output
                        : JSON.stringify(result.output, null, 2)}
                    </pre>
                  </div>
                )}

                {!result.success && result.error && (
                  <div className="mt-2">
                    <Label className="text-xs font-medium text-red-600 dark:text-red-400">
                      Error:
                    </Label>
                    <pre className="mt-1 p-2 bg-background rounded text-xs font-mono overflow-x-auto text-red-600 dark:text-red-400">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {results.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Showing last 5 results. {results.length - 5} more hidden.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Warning for unsaved tools */}
      {!toolId && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <p className="font-medium">Tool not saved</p>
            <p>Save your tool first to test it via the API.</p>
          </div>
        </div>
      )}
    </div>
  );
}
