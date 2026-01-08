"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nodeTypes } from "@/components/flows/flow-nodes";
import { flowsApi } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Edit,
  Trash2,
  Copy,
  Loader2,
  GitBranch,
  MoreVertical,
  Rocket,
  Clock,
  Calendar,
  User,
  Info,
  ListTree,
  Activity,
} from "lucide-react";
import Link from "next/link";

interface FlowStep {
  id: string;
  name: string;
  step_type: string;
  position_x: number;
  position_y: number;
  config: Record<string, any>;
}

interface FlowConnection {
  id: string;
  source_step_id: string;
  target_step_id: string;
  route_name?: string;
  label?: string;
  connection_type: string;
}

interface FlowData {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  connections: FlowConnection[];
  is_deployed: boolean;
  environment?: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  is_public: boolean;
  tags?: string[];
}

export default function FlowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch flow data
  const {
    data: flow,
    isLoading,
    error,
  } = useQuery<FlowData>({
    queryKey: ["flow", flowId],
    queryFn: async () => {
      const response = await flowsApi.get(flowId);
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await flowsApi.delete(flowId);
    },
    onSuccess: () => {
      toast.success("Flow deleted successfully");
      router.push("/flows");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete flow");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const response = await flowsApi.duplicate(flowId);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow duplicated successfully");
      router.push(`/flows/${data.id}/edit`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to duplicate flow");
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      const response = await flowsApi.deploy(flowId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow", flowId] });
      toast.success("Flow deployed successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to deploy flow");
    },
  });

  // Convert flow data to ReactFlow format
  const nodes =
    flow?.steps?.map((step) => ({
      id: step.id,
      type: step.step_type,
      position: { x: step.position_x || 0, y: step.position_y || 0 },
      data: {
        label: step.name,
        ...step.config,
      },
    })) || [];

  const edges =
    flow?.connections?.map((conn) => ({
      id: conn.id,
      source: conn.source_step_id,
      target: conn.target_step_id,
      sourceHandle: conn.route_name || undefined,
      label: conn.label,
      type: conn.connection_type === "conditional" ? "step" : "default",
    })) || [];

  if (isLoading) {
    return (
      <DashboardLayout title="Flow Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !flow) {
    return (
      <DashboardLayout title="Flow Details">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">Failed to load flow</p>
          <Button variant="outline" asChild>
            <Link href="/flows">Back to Flows</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={flow.name}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/flows">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/flows/${flowId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/flows/${flowId}/run`}>
              <Play className="h-4 w-4 mr-2" />
              Run
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => duplicateMutation.mutate()}
                disabled={duplicateMutation.isPending}
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deployMutation.mutate()}
                disabled={deployMutation.isPending || flow.is_deployed}
              >
                <Rocket className="mr-2 h-4 w-4" />
                {flow.is_deployed ? "Already Deployed" : "Deploy"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="diagram" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Diagram
          </TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-2">
            <ListTree className="h-4 w-4" />
            Steps
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Executions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <GitBranch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{flow.name}</CardTitle>
                      <CardDescription>
                        {flow.steps?.length || 0} steps,{" "}
                        {flow.connections?.length || 0} connections
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {flow.is_deployed && (
                      <Badge variant="default" className="bg-green-600">
                        <Rocket className="h-3 w-3 mr-1" />
                        Deployed
                      </Badge>
                    )}
                    {flow.is_public && <Badge variant="secondary">Public</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-sm">
                    {flow.description || "No description provided"}
                  </p>
                </div>

                {flow.tags && flow.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {flow.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {flow.environment && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Environment
                    </h4>
                    <Badge variant="secondary">{flow.environment}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(flow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="text-sm">
                      {new Date(flow.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="text-sm">{flow.owner_id || "You"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button className="w-full" asChild>
                    <Link href={`/flows/${flowId}/run`}>
                      <Play className="h-4 w-4 mr-2" />
                      Run Flow
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/flows/${flowId}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Flow
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Diagram Tab */}
        <TabsContent value="diagram">
          <Card>
            <CardHeader>
              <CardTitle>Flow Diagram</CardTitle>
              <CardDescription>
                Visual representation of the flow (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] border rounded-lg bg-muted/30">
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag
                    zoomOnScroll
                  >
                    <Controls showInteractive={false} />
                    <MiniMap />
                    <Background
                      variant={BackgroundVariant.Dots}
                      gap={15}
                      size={1}
                    />
                  </ReactFlow>
                </ReactFlowProvider>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps Tab */}
        <TabsContent value="steps">
          <Card>
            <CardHeader>
              <CardTitle>Flow Steps</CardTitle>
              <CardDescription>
                List of all steps in this flow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flow.steps && flow.steps.length > 0 ? (
                <div className="space-y-3">
                  {flow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{step.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {step.step_type}
                          </Badge>
                        </div>
                        {step.config && Object.keys(step.config).length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {Object.entries(step.config)
                              .filter(([k]) => k !== "label")
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No steps defined in this flow
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Executions</CardTitle>
                  <CardDescription>
                    History of flow executions
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/executions?flow_id=${flowId}`}>
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No executions yet</p>
                <p className="text-sm">Run the flow to see execution history</p>
                <Button className="mt-4" asChild>
                  <Link href={`/flows/${flowId}/run`}>
                    <Play className="h-4 w-4 mr-2" />
                    Run Flow
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{flow.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
