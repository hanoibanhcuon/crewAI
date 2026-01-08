"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nodeTypes, nodePalette } from "@/components/flows/flow-nodes";
import { flowsApi, crewsApi } from "@/lib/api";
import {
  Save,
  ArrowLeft,
  Play,
  Trash2,
  Loader2,
  Settings,
  GripVertical,
} from "lucide-react";

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

interface FlowData {
  id: string;
  name: string;
  description: string;
  steps: any[];
  connections: any[];
}

export default function FlowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const isNew = flowId === "new";
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [flow, setFlow] = useState<FlowData | null>(null);
  const [flowName, setFlowName] = useState("");
  const [flowDescription, setFlowDescription] = useState("");
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [crews, setCrews] = useState<any[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load flow data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load crews for crew node selection
        const crewsRes = await crewsApi.list();
        setCrews(crewsRes.data?.items || []);

        if (!isNew) {
          const flowRes = await flowsApi.get(flowId);
          const flowData = flowRes.data;
          setFlow(flowData);
          setFlowName(flowData.name);
          setFlowDescription(flowData.description || "");

          // Convert steps to nodes
          const flowNodes = (flowData.steps || []).map((step: any) => ({
            id: step.id,
            type: step.step_type,
            position: { x: step.position_x || 0, y: step.position_y || 0 },
            data: {
              label: step.name,
              ...step.config,
            },
          }));

          // Convert connections to edges
          const flowEdges = (flowData.connections || []).map((conn: any) => ({
            id: conn.id,
            source: conn.source_step_id,
            target: conn.target_step_id,
            sourceHandle: conn.route_name || undefined,
            label: conn.label,
            type: conn.connection_type === "conditional" ? "step" : "default",
          }));

          setNodes(flowNodes);
          setEdges(flowEdges);
        } else {
          // New flow - add start node
          setNodes([
            {
              id: "start_1",
              type: "start",
              position: { x: 250, y: 50 },
              data: { label: "Start" },
            },
          ]);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load flow");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId, isNew]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: {
          label: nodePalette.find((n) => n.type === type)?.label || type,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, [key]: value } }
          : node
      )
    );
    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, [key]: value } } : null
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      setError("Flow name is required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      // Convert nodes to steps
      const steps = nodes.map((node) => ({
        id: node.id,
        name: node.data.label || node.type,
        step_type: node.type,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
        config: {
          ...node.data,
          label: undefined, // Remove label from config
        },
      }));

      // Convert edges to connections
      const connections = edges.map((edge) => ({
        id: edge.id,
        source_step_id: edge.source,
        target_step_id: edge.target,
        route_name: edge.sourceHandle,
        label: edge.label,
        connection_type: edge.type === "step" ? "conditional" : "normal",
      }));

      const flowData = {
        name: flowName,
        description: flowDescription,
        steps,
        connections,
      };

      if (isNew) {
        const response = await flowsApi.create(flowData);
        router.push(`/flows/${response.data.id}/edit`);
      } else {
        await flowsApi.update(flowId, flowData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save flow");
    } finally {
      setIsSaving(false);
    }
  };

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Flow Editor">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={isNew ? "New Flow" : `Edit: ${flowName}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/flows")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
          {!isNew && (
            <Button variant="default">
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4 h-[calc(100vh-200px)]">
        {/* Node Palette */}
        <Card className="lg:col-span-1 overflow-y-auto">
          <CardHeader>
            <CardTitle>Flow Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Flow name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                placeholder="Flow description"
                rows={2}
              />
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Node Palette</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Drag nodes to canvas
              </p>
              <div className="space-y-2">
                {nodePalette.map((node) => (
                  <div
                    key={node.type}
                    className="flex items-center gap-3 p-2 rounded-lg border cursor-grab hover:bg-muted/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded"
                      style={{ backgroundColor: `${node.color}20` }}
                    >
                      <node.icon
                        className="h-4 w-4"
                        style={{ color: node.color }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{node.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {node.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow Canvas */}
        <div
          ref={reactFlowWrapper}
          className="lg:col-span-3 border rounded-lg bg-muted/30"
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Controls />
              <MiniMap />
              <Background
                variant={BackgroundVariant.Dots}
                gap={15}
                size={1}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Node Properties Sheet */}
      <Sheet open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Node Properties</SheetTitle>
            <SheetDescription>Configure the selected node</SheetDescription>
          </SheetHeader>
          {selectedNode && (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={selectedNode.data.label || ""}
                  onChange={(e) => updateNodeData("label", e.target.value)}
                />
              </div>

              {/* Crew-specific settings */}
              {selectedNode.type === "crew" && (
                <div className="space-y-2">
                  <Label>Crew</Label>
                  <Select
                    value={selectedNode.data.crew_id || ""}
                    onValueChange={(value) => {
                      updateNodeData("crew_id", value);
                      const crew = crews.find((c) => c.id === value);
                      if (crew) {
                        updateNodeData("crew_name", crew.name);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crew" />
                    </SelectTrigger>
                    <SelectContent>
                      {crews.map((crew) => (
                        <SelectItem key={crew.id} value={crew.id}>
                          {crew.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Function-specific settings */}
              {selectedNode.type === "function" && (
                <>
                  <div className="space-y-2">
                    <Label>Function Name</Label>
                    <Input
                      value={selectedNode.data.function_name || ""}
                      onChange={(e) =>
                        updateNodeData("function_name", e.target.value)
                      }
                      placeholder="my_function"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Textarea
                      value={selectedNode.data.code || ""}
                      onChange={(e) => updateNodeData("code", e.target.value)}
                      placeholder="def my_function(state):\n    return state"
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                </>
              )}

              {/* Router-specific settings */}
              {selectedNode.type === "router" && (
                <div className="space-y-2">
                  <Label>Routes (comma-separated)</Label>
                  <Input
                    value={(selectedNode.data.routes || []).join(", ")}
                    onChange={(e) =>
                      updateNodeData(
                        "routes",
                        e.target.value.split(",").map((r) => r.trim())
                      )
                    }
                    placeholder="route_a, route_b"
                  />
                </div>
              )}

              {/* Listen-specific settings */}
              {selectedNode.type === "listen" && (
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Input
                    value={selectedNode.data.event || ""}
                    onChange={(e) => updateNodeData("event", e.target.value)}
                    placeholder="event_name"
                  />
                </div>
              )}

              {/* Human Feedback-specific settings */}
              {selectedNode.type === "human_feedback" && (
                <div className="space-y-2">
                  <Label>Prompt</Label>
                  <Textarea
                    value={selectedNode.data.prompt || ""}
                    onChange={(e) => updateNodeData("prompt", e.target.value)}
                    placeholder="Please review and provide feedback..."
                    rows={3}
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={deleteSelectedNode}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
