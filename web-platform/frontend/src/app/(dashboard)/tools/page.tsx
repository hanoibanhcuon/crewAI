"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Wrench,
  Globe,
  Database,
  FileText,
  Code,
  Image,
  Loader2,
  MoreVertical,
  Edit,
  Trash,
  TestTube,
} from "lucide-react";
import Link from "next/link";
import { toolsApi } from "@/lib/api";
import { toast } from "sonner";

interface Tool {
  id: string;
  name: string;
  description: string;
  tool_type: string;
  category?: string;
  is_builtin?: boolean;
}

// Built-in tools for reference
const builtInToolCategories = [
  {
    name: "Web & Search",
    icon: Globe,
    tools: [
      { name: "SerperDevTool", description: "Search the web using Serper.dev API" },
      { name: "WebsiteSearchTool", description: "Search within a website" },
      { name: "ScrapeWebsiteTool", description: "Scrape content from websites" },
    ],
  },
  {
    name: "File & Document",
    icon: FileText,
    tools: [
      { name: "FileReadTool", description: "Read content from files" },
      { name: "PDFSearchTool", description: "Search within PDF documents" },
      { name: "DOCXSearchTool", description: "Search within DOCX files" },
    ],
  },
  {
    name: "Database",
    icon: Database,
    tools: [
      { name: "PGSearchTool", description: "Search PostgreSQL databases" },
      { name: "MySQLTool", description: "Query MySQL databases" },
    ],
  },
  {
    name: "Code & AI",
    icon: Code,
    tools: [
      { name: "CodeInterpreterTool", description: "Execute Python code" },
      { name: "RAGTool", description: "Retrieval-augmented generation" },
    ],
  },
  {
    name: "Vision",
    icon: Image,
    tools: [
      { name: "VisionTool", description: "Analyze images with AI" },
      { name: "DALL-E Tool", description: "Generate images with DALL-E" },
    ],
  },
];

export default function ToolsPage() {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const queryClient = useQueryClient();

  // Fetch custom tools from API
  const { data: customTools = [], isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const response = await toolsApi.list();
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await toolsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      toast.success("Tool deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTool(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete tool");
    },
  });

  const handleDelete = (tool: Tool) => {
    setSelectedTool(tool);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTool) {
      deleteMutation.mutate(selectedTool.id);
    }
  };

  return (
    <DashboardLayout
      title="Tools"
      actions={
        <Button asChild>
          <Link href="/tools/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Tool
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="custom" className="space-y-6">
        <TabsList>
          <TabsTrigger value="custom">Custom Tools</TabsTrigger>
          <TabsTrigger value="builtin">Built-in Tools</TabsTrigger>
        </TabsList>

        {/* Custom Tools Tab */}
        <TabsContent value="custom">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No custom tools yet</h3>
              <p className="text-muted-foreground">
                Create your first custom tool to extend agent capabilities
              </p>
              <Button className="mt-4" asChild>
                <Link href="/tools/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Tool
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customTools
                .filter(
                  (tool: Tool) =>
                    !search ||
                    tool.name.toLowerCase().includes(search.toLowerCase()) ||
                    tool.description.toLowerCase().includes(search.toLowerCase())
                )
                .map((tool: Tool) => (
                  <Card key={tool.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                          <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{tool.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {tool.tool_type || "custom"}
                          </CardDescription>
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
                            <Link href={`/tools/${tool.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tools/${tool.id}/test`}>
                              <TestTube className="mr-2 h-4 w-4" />
                              Test
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(tool)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Built-in Tools Tab */}
        <TabsContent value="builtin">
          <div className="space-y-8">
            {builtInToolCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.tools
                    .filter(
                      (tool) =>
                        !search ||
                        tool.name.toLowerCase().includes(search.toLowerCase()) ||
                        tool.description.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((tool) => (
                      <Card key={tool.name} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                              <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{tool.name}</CardTitle>
                              <CardDescription className="text-xs">Built-in</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedTool?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
