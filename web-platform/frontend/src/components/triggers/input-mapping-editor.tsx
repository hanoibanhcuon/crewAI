"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ArrowRight,
  Info,
  Code,
  Variable,
} from "lucide-react";

interface InputMapping {
  targetKey: string;
  sourcePath: string;
  defaultValue?: string;
  transform?: string;
}

interface InputMappingEditorProps {
  mappings: InputMapping[];
  onChange: (mappings: InputMapping[]) => void;
  triggerType: string;
  targetInputs?: { name: string; type: string }[];
}

// Common source path suggestions based on trigger type
const sourcePathSuggestions: Record<string, { path: string; description: string }[]> = {
  webhook: [
    { path: "body", description: "Full webhook body" },
    { path: "body.data", description: "Data object from body" },
    { path: "body.message", description: "Message field" },
    { path: "body.user.id", description: "User ID from body" },
    { path: "body.user.email", description: "User email from body" },
    { path: "body.action", description: "Action type" },
    { path: "body.payload", description: "Payload object" },
    { path: "headers.x-request-id", description: "Request ID header" },
    { path: "query.param", description: "Query parameter" },
  ],
  schedule: [
    { path: "timestamp", description: "Execution timestamp" },
    { path: "schedule_name", description: "Schedule name" },
    { path: "run_count", description: "Number of runs" },
    { path: "cron_expression", description: "Cron expression" },
  ],
  event: [
    { path: "event_type", description: "Event type" },
    { path: "event_data", description: "Event data object" },
    { path: "event_data.id", description: "Event data ID" },
    { path: "event_data.payload", description: "Event payload" },
    { path: "timestamp", description: "Event timestamp" },
    { path: "source", description: "Event source" },
  ],
};

// Transform options
const transformOptions = [
  { value: "none", label: "None" },
  { value: "string", label: "To String" },
  { value: "number", label: "To Number" },
  { value: "boolean", label: "To Boolean" },
  { value: "json", label: "Parse JSON" },
  { value: "lowercase", label: "Lowercase" },
  { value: "uppercase", label: "Uppercase" },
  { value: "trim", label: "Trim whitespace" },
];

export function InputMappingEditor({
  mappings,
  onChange,
  triggerType,
  targetInputs = [],
}: InputMappingEditorProps) {
  const [newMapping, setNewMapping] = useState<InputMapping>({
    targetKey: "",
    sourcePath: "",
    defaultValue: "",
    transform: "none",
  });

  const handleAdd = () => {
    if (!newMapping.targetKey || !newMapping.sourcePath) return;

    onChange([...mappings, { ...newMapping }]);
    setNewMapping({
      targetKey: "",
      sourcePath: "",
      defaultValue: "",
      transform: "none",
    });
  };

  const handleRemove = (index: number) => {
    const updated = mappings.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdate = (index: number, field: keyof InputMapping, value: string) => {
    const updated = mappings.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onChange(updated);
  };

  const suggestions = sourcePathSuggestions[triggerType] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>
          Map trigger payload fields to crew/flow input variables using dot notation
        </span>
      </div>

      {/* Existing Mappings */}
      {mappings.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Configured Mappings</Label>
          <div className="space-y-2">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    {mapping.sourcePath}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="font-mono text-xs">
                    <Variable className="h-3 w-3 mr-1" />
                    {mapping.targetKey}
                  </Badge>
                  {mapping.transform && mapping.transform !== "none" && (
                    <Badge variant="outline" className="text-xs">
                      {transformOptions.find((t) => t.value === mapping.transform)?.label}
                    </Badge>
                  )}
                  {mapping.defaultValue && (
                    <span className="text-xs text-muted-foreground">
                      (default: {mapping.defaultValue})
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Mapping */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Add Mapping</CardTitle>
          <CardDescription className="text-xs">
            Define how trigger data maps to target inputs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Source Path</Label>
              <Input
                value={newMapping.sourcePath}
                onChange={(e) =>
                  setNewMapping({ ...newMapping, sourcePath: e.target.value })
                }
                placeholder="body.data.field"
                className="font-mono text-sm"
              />
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s.path}
                      type="button"
                      onClick={() =>
                        setNewMapping({ ...newMapping, sourcePath: s.path })
                      }
                      className="text-xs px-2 py-0.5 bg-muted rounded hover:bg-muted/80 transition-colors"
                      title={s.description}
                    >
                      {s.path}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target Input Key</Label>
              {targetInputs.length > 0 ? (
                <Select
                  value={newMapping.targetKey}
                  onValueChange={(value) =>
                    setNewMapping({ ...newMapping, targetKey: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select input" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetInputs.map((input) => (
                      <SelectItem key={input.name} value={input.name}>
                        {input.name} ({input.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={newMapping.targetKey}
                  onChange={(e) =>
                    setNewMapping({ ...newMapping, targetKey: e.target.value })
                  }
                  placeholder="input_variable_name"
                  className="font-mono text-sm"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Default Value (optional)</Label>
              <Input
                value={newMapping.defaultValue}
                onChange={(e) =>
                  setNewMapping({ ...newMapping, defaultValue: e.target.value })
                }
                placeholder="Default if path not found"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Transform (optional)</Label>
              <Select
                value={newMapping.transform || "none"}
                onValueChange={(value) =>
                  setNewMapping({ ...newMapping, transform: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transformOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!newMapping.targetKey || !newMapping.sourcePath}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-2">Dot Notation Examples:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <code className="bg-muted px-1 rounded">body.user.email</code> -
            Access nested fields
          </li>
          <li>
            <code className="bg-muted px-1 rounded">body.items.0.name</code> -
            Access array elements by index
          </li>
          <li>
            <code className="bg-muted px-1 rounded">headers.authorization</code> -
            Access headers
          </li>
        </ul>
      </div>
    </div>
  );
}

// Helper to convert InputMapping array to Record format for API
export function mappingsToRecord(
  mappings: InputMapping[]
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const mapping of mappings) {
    record[mapping.targetKey] = mapping.sourcePath;
  }
  return record;
}

// Helper to convert Record format to InputMapping array
export function recordToMappings(
  record: Record<string, string> | undefined
): InputMapping[] {
  if (!record) return [];
  return Object.entries(record).map(([targetKey, sourcePath]) => ({
    targetKey,
    sourcePath,
    defaultValue: "",
    transform: "none",
  }));
}
