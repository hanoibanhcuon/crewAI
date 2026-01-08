"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";

interface ArgField {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: string;
  enum?: string[];
}

interface ArgsSchemaBuilderProps {
  schema: ArgField[];
  onChange: (schema: ArgField[]) => void;
}

const fieldTypes = [
  { value: "string", label: "String", icon: "Aa" },
  { value: "integer", label: "Integer", icon: "#" },
  { value: "number", label: "Number", icon: "1.5" },
  { value: "boolean", label: "Boolean", icon: "✓" },
  { value: "array", label: "Array", icon: "[]" },
  { value: "object", label: "Object", icon: "{}" },
];

export function ArgsSchemaBuilder({
  schema,
  onChange,
}: ArgsSchemaBuilderProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newField: ArgField = {
      name: `arg_${schema.length + 1}`,
      type: "string",
      description: "",
      required: false,
    };
    onChange([...schema, newField]);
    setExpandedIndex(schema.length);
  };

  const handleRemove = (index: number) => {
    const updated = schema.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: Partial<ArgField>) => {
    const updated = schema.map((arg, i) => {
      if (i === index) {
        return { ...arg, ...field };
      }
      return arg;
    });
    onChange(updated);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= schema.length) return;

    const updated = [...schema];
    const [removed] = updated.splice(index, 1);
    updated.splice(newIndex, 0, removed);
    onChange(updated);

    if (expandedIndex === index) {
      setExpandedIndex(newIndex);
    } else if (expandedIndex === newIndex) {
      setExpandedIndex(index);
    }
  };

  // Convert to JSON Schema format
  const toJsonSchema = (): object => {
    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const field of schema) {
      const prop: Record<string, unknown> = {
        type: field.type,
        description: field.description,
      };

      if (field.default !== undefined && field.default !== "") {
        try {
          if (field.type === "integer" || field.type === "number") {
            prop.default = Number(field.default);
          } else if (field.type === "boolean") {
            prop.default = field.default === "true";
          } else if (field.type === "array" || field.type === "object") {
            prop.default = JSON.parse(field.default);
          } else {
            prop.default = field.default;
          }
        } catch {
          prop.default = field.default;
        }
      }

      if (field.enum && field.enum.length > 0) {
        prop.enum = field.enum;
      }

      properties[field.name] = prop;

      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      type: "object",
      properties,
      required,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Arguments Schema</h4>
          <p className="text-xs text-muted-foreground">
            Define the input arguments for your tool
          </p>
        </div>
        <Button onClick={handleAdd} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Argument
        </Button>
      </div>

      {schema.length === 0 ? (
        <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
          <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No arguments defined</p>
          <p className="text-xs">
            Click &quot;Add Argument&quot; to define tool input parameters
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {schema.map((field, index) => (
            <Card
              key={index}
              className={expandedIndex === index ? "border-primary" : ""}
            >
              <CardHeader
                className="py-3 cursor-pointer"
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1 flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                      {field.name}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {fieldTypes.find((t) => t.value === field.type)?.label ||
                        field.type}
                    </Badge>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(index, "up");
                      }}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveField(index, "down");
                      }}
                      disabled={index === schema.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedIndex === index && (
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={field.name}
                        onChange={(e) =>
                          handleUpdate(index, { name: e.target.value })
                        }
                        placeholder="argument_name"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          handleUpdate(index, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <code className="w-6 text-center text-xs">
                                  {type.icon}
                                </code>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      value={field.description}
                      onChange={(e) =>
                        handleUpdate(index, { description: e.target.value })
                      }
                      placeholder="Describe what this argument is for..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Default Value</Label>
                      <Input
                        value={field.default || ""}
                        onChange={(e) =>
                          handleUpdate(index, { default: e.target.value })
                        }
                        placeholder="Default value (optional)"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Enum Values (comma separated)</Label>
                      <Input
                        value={field.enum?.join(", ") || ""}
                        onChange={(e) => {
                          const values = e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean);
                          handleUpdate(index, {
                            enum: values.length > 0 ? values : undefined,
                          });
                        }}
                        placeholder="option1, option2, option3"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={(checked) =>
                        handleUpdate(index, { required: checked })
                      }
                    />
                    <Label className="text-sm">Required argument</Label>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* JSON Schema Preview */}
      {schema.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs font-medium mb-2">Generated JSON Schema:</p>
          <pre className="text-xs font-mono overflow-x-auto">
            {JSON.stringify(toJsonSchema(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Convert ArgField array to JSON Schema format
export function argsToJsonSchema(args: ArgField[]): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];

  for (const field of args) {
    const prop: Record<string, unknown> = {
      type: field.type,
      description: field.description,
    };

    if (field.default !== undefined && field.default !== "") {
      prop.default = field.default;
    }

    if (field.enum && field.enum.length > 0) {
      prop.enum = field.enum;
    }

    properties[field.name] = prop;

    if (field.required) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

// Convert JSON Schema to ArgField array
export function jsonSchemaToArgs(schema: any): ArgField[] {
  if (!schema || !schema.properties) return [];

  const required = schema.required || [];

  return Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
    name,
    type: prop.type || "string",
    description: prop.description || "",
    required: required.includes(name),
    default: prop.default !== undefined ? String(prop.default) : undefined,
    enum: prop.enum,
  }));
}
