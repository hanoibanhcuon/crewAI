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
  Layers,
  Play,
  Rocket,
  Loader2,
  StopCircle,
} from "lucide-react";
import Link from "next/link";
import { crewsApi } from "@/lib/api";
import { toast } from "sonner";

interface Crew {
  id: string;
  name: string;
  description: string;
  process: string;
  agents_count?: number;
  tasks_count?: number;
  is_deployed?: boolean;
  environment?: string;
}

const processLabels: Record<string, string> = {
  sequential: "tuần tự",
  hierarchical: "phân cấp",
  parallel: "song song",
};

export default function CrewsPage() {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch crews from API
  const { data: crews = [], isLoading, error } = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const response = await crewsApi.list();
      return response.data.items || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await crewsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast.success("Đã xóa đội nhóm thành công");
      setDeleteDialogOpen(false);
      setSelectedCrew(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể xóa đội nhóm");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await crewsApi.duplicate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast.success("Đã sao chép đội nhóm thành công");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể sao chép đội nhóm");
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async ({ id, environment }: { id: string; environment: string }) => {
      const response = await crewsApi.deploy(id, environment);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast.success("Đã triển khai đội nhóm thành công");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể triển khai đội nhóm");
    },
  });

  const handleDelete = (crew: Crew) => {
    setSelectedCrew(crew);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCrew) {
      deleteMutation.mutate(selectedCrew.id);
    }
  };

  const handleDuplicate = (crew: Crew) => {
    duplicateMutation.mutate(crew.id);
  };

  const handleRun = (crew: Crew) => {
    router.push(`/crews/${crew.id}/run`);
  };

  const handleDeploy = (crew: Crew, environment: string) => {
    deployMutation.mutate({ id: crew.id, environment });
  };

  const filteredCrews = crews.filter(
    (crew: Crew) =>
      crew.name.toLowerCase().includes(search.toLowerCase()) ||
      crew.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Đội nhóm">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Đội nhóm">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Không thể tải danh sách đội nhóm</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["crews"] })}>
            Thử lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Đội nhóm"
      actions={
        <Button asChild>
          <Link href="/crews/new">
            <Plus className="mr-2 h-4 w-4" />
            Đội nhóm mới
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm đội nhóm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Crews Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrews.map((crew: Crew) => (
          <Card key={crew.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{crew.name}</CardTitle>
                  <CardDescription className="capitalize">Quy trình {processLabels[crew.process] || crew.process || "tuần tự"}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRun(crew)}>
                    <Play className="mr-2 h-4 w-4" />
                    Chạy
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/crews/${crew.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicate(crew)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Sao chép
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeploy(crew, "development")}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Triển khai Dev
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeploy(crew, "staging")}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Triển khai Staging
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeploy(crew, "production")}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Triển khai Production
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(crew)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{crew.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {crew.agents_count || 0} tác nhân
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {crew.tasks_count || 0} nhiệm vụ
                </span>
                {crew.is_deployed && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2.5 py-0.5 text-xs font-medium">
                    {crew.environment}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => handleRun(crew)}>
                  <Play className="mr-2 h-4 w-4" />
                  Chạy
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/crews/${crew.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeploy(crew, "production")}
                  disabled={deployMutation.isPending}
                >
                  <Rocket className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCrews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Không tìm thấy đội nhóm</h3>
          <p className="text-muted-foreground">
            Tạo đội nhóm đầu tiên của bạn để bắt đầu
          </p>
          <Button className="mt-4" asChild>
            <Link href="/crews/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo đội nhóm
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đội nhóm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{selectedCrew?.name}&quot;? Hành động này không thể hoàn tác.
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
