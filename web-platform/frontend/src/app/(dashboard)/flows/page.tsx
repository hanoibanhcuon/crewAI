"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  GitBranch,
  Play,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { flowsApi } from "@/lib/api";
import { toast } from "sonner";

interface Flow {
  id: string;
  name: string;
  description: string;
  steps_count?: number;
  is_deployed?: boolean;
  environment?: string;
}

export default function FlowsPage() {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch flows from API
  const { data: flows = [], isLoading, error } = useQuery({
    queryKey: ["flows"],
    queryFn: async () => {
      const response = await flowsApi.list();
      return response.data.items || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await flowsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Đã xóa quy trình thành công");
      setDeleteDialogOpen(false);
      setSelectedFlow(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể xóa quy trình");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await flowsApi.duplicate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Đã sao chép quy trình thành công");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể sao chép quy trình");
    },
  });

  const handleDelete = (flow: Flow) => {
    setSelectedFlow(flow);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedFlow) {
      deleteMutation.mutate(selectedFlow.id);
    }
  };

  const handleDuplicate = (flow: Flow) => {
    duplicateMutation.mutate(flow.id);
  };

  const handleRun = (flow: Flow) => {
    router.push(`/flows/${flow.id}/run`);
  };

  const filteredFlows = flows.filter(
    (flow: Flow) =>
      flow.name.toLowerCase().includes(search.toLowerCase()) ||
      flow.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Quy trình">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Quy trình">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Không thể tải danh sách quy trình</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["flows"] })}>
            Thử lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Quy trình"
      actions={
        <Button asChild>
          <Link href="/flows/new">
            <Plus className="mr-2 h-4 w-4" />
            Quy trình mới
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm quy trình..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Flows Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFlows.map((flow: Flow) => (
          <Card key={flow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{flow.name}</CardTitle>
                  <CardDescription>{flow.steps_count || 0} bước</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRun(flow)}>
                    <Play className="mr-2 h-4 w-4" />
                    Chạy
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/flows/${flow.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(flow)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(flow)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{flow.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {flow.is_deployed && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2.5 py-0.5 text-xs font-medium">
                    {flow.environment}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleRun(flow)}>
                  <Play className="mr-2 h-4 w-4" />
                  Chạy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/flows/${flow.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(flow)}
                  disabled={duplicateMutation.isPending}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFlows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Không tìm thấy quy trình</h3>
          <p className="text-muted-foreground">
            Tạo quy trình đầu tiên của bạn để bắt đầu
          </p>
          <Button className="mt-4" asChild>
            <Link href="/flows/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo quy trình
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa quy trình</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{selectedFlow?.name}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
