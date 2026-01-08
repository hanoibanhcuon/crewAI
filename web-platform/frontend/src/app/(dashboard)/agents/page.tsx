"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Bot,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { agentsApi } from "@/lib/api";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  llm_model: string;
  tools: string[];
  is_active: boolean;
}

// Memoized Agent Card component to prevent re-renders
const AgentCard = memo(function AgentCard({
  agent,
  onDelete,
  onDuplicate,
  isDuplicating,
}: {
  agent: Agent;
  onDelete: (agent: Agent) => void;
  onDuplicate: (agent: Agent) => void;
  isDuplicating: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription>{agent.role}</CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/agents/${agent.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(agent)}>
              <Copy className="mr-2 h-4 w-4" />
              Sao chép
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(agent)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{agent.goal}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
            {agent.llm_model || "gpt-4"}
          </span>
          {(agent.tools || []).map((tool: string) => (
            <span
              key={tool}
              className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium"
            >
              {tool}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/agents/${agent.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(agent)}
            disabled={isDuplicating}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(agent)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const queryClient = useQueryClient();

  // Debounce search for better performance
  const debouncedSearch = useDebounce(search, 300);

  // Fetch agents from API
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await agentsApi.list();
      return response.data.items || [];
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await agentsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Đã xóa tác nhân thành công");
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể xóa tác nhân");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await agentsApi.duplicate(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Đã sao chép tác nhân thành công");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Không thể sao chép tác nhân");
    },
  });

  // Memoized handlers
  const handleDelete = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (selectedAgent) {
      deleteMutation.mutate(selectedAgent.id);
    }
  }, [selectedAgent, deleteMutation]);

  const handleDuplicate = useCallback((agent: Agent) => {
    duplicateMutation.mutate(agent.id);
  }, [duplicateMutation]);

  const handleRetry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["agents"] });
  }, [queryClient]);

  // Memoized filtered agents
  const filteredAgents = useMemo(() => {
    if (!debouncedSearch) return agents;
    const searchLower = debouncedSearch.toLowerCase();
    return agents.filter(
      (agent: Agent) =>
        agent.name.toLowerCase().includes(searchLower) ||
        agent.role.toLowerCase().includes(searchLower)
    );
  }, [agents, debouncedSearch]);

  if (isLoading) {
    return (
      <DashboardLayout title="Tác nhân">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Tác nhân">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-destructive mb-4">Không thể tải danh sách tác nhân</p>
          <Button onClick={handleRetry}>
            Thử lại
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Tác nhân"
      actions={
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Tác nhân mới
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tác nhân..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent: Agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            isDuplicating={duplicateMutation.isPending}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Không tìm thấy tác nhân</h3>
          <p className="text-muted-foreground">
            Tạo tác nhân đầu tiên của bạn để bắt đầu
          </p>
          <Button className="mt-4" asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo tác nhân
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tác nhân</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{selectedAgent?.name}&quot;? Hành động này không thể hoàn tác.
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
