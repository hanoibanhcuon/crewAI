"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { knowledgeApi } from "@/lib/api";
import {
  Plus,
  Upload,
  FileText,
  Database,
  Trash2,
  RefreshCw,
  Search,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Loader2,
  ChevronRight,
  Settings,
  Layers,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  FolderUp,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface KnowledgeSource {
  id: string;
  name: string;
  description?: string;
  source_type: "file" | "url" | "text" | "directory";
  status: "pending" | "processing" | "ready" | "error";
  file_name?: string;
  file_size?: number;
  file_type?: string;
  url?: string;
  chunk_count: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
}

// Mock data for development
const mockSources: KnowledgeSource[] = [
  {
    id: "1",
    name: "Product Documentation",
    description: "All product docs and guides",
    source_type: "file",
    status: "ready",
    file_name: "product-docs.pdf",
    file_size: 2500000,
    file_type: "application/pdf",
    chunk_count: 156,
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "text-embedding-3-small",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T11:00:00Z",
  },
  {
    id: "2",
    name: "API Reference",
    description: "API endpoints and schemas",
    source_type: "url",
    status: "ready",
    url: "https://docs.example.com/api",
    chunk_count: 89,
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "text-embedding-3-small",
    created_at: "2024-01-14T09:00:00Z",
    updated_at: "2024-01-14T09:30:00Z",
  },
  {
    id: "3",
    name: "FAQ Content",
    description: "Frequently asked questions",
    source_type: "text",
    status: "processing",
    chunk_count: 0,
    chunk_size: 500,
    chunk_overlap: 100,
    embedding_model: "text-embedding-3-small",
    created_at: "2024-01-16T14:00:00Z",
    updated_at: "2024-01-16T14:00:00Z",
  },
];

const fileTypeIcons: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "text/plain": FileText,
  "text/csv": FileSpreadsheet,
  "application/json": FileCode,
  "image/png": FileImage,
  "image/jpeg": FileImage,
};

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  processing: { icon: Loader2, color: "text-blue-500", label: "Processing" },
  ready: { icon: CheckCircle, color: "text-green-500", label: "Ready" },
  error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    source_type: "file" as KnowledgeSource["source_type"],
    url: "",
    text_content: "",
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "text-embedding-3-small",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Bulk upload state
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<Record<string, { status: "pending" | "uploading" | "done" | "error"; progress: number; error?: string }>>({});
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkSettings, setBulkSettings] = useState({
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "text-embedding-3-small",
  });
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const response = await knowledgeApi.list();
      setSources(response.data?.items || []);
    } catch (err) {
      console.error("Failed to load knowledge sources:", err);
      // Use mock data as fallback
      setSources(mockSources);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", createForm.name);
      formData.append("description", createForm.description);
      formData.append("source_type", createForm.source_type);
      formData.append("chunk_size", createForm.chunk_size.toString());
      formData.append("chunk_overlap", createForm.chunk_overlap.toString());
      formData.append("embedding_model", createForm.embedding_model);

      if (createForm.source_type === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (createForm.source_type === "url") {
        formData.append("url", createForm.url);
      } else if (createForm.source_type === "text") {
        formData.append("text_content", createForm.text_content);
      }

      await knowledgeApi.create(formData);
      setShowCreateDialog(false);
      resetCreateForm();
      loadSources();
    } catch (err) {
      console.error("Failed to create knowledge source:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this knowledge source?")) return;
    try {
      await knowledgeApi.delete(id);
      loadSources();
    } catch (err) {
      console.error("Failed to delete knowledge source:", err);
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await knowledgeApi.reprocess(id);
      loadSources();
    } catch (err) {
      console.error("Failed to reprocess knowledge source:", err);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      description: "",
      source_type: "file",
      url: "",
      text_content: "",
      chunk_size: 1000,
      chunk_overlap: 200,
      embedding_model: "text-embedding-3-small",
    });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!createForm.name) {
        setCreateForm({ ...createForm, name: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

  // Bulk upload handlers
  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setBulkFiles((prev) => [...prev, ...files]);
      // Initialize progress for new files
      const newProgress: Record<string, { status: "pending" | "uploading" | "done" | "error"; progress: number }> = {};
      files.forEach((file) => {
        newProgress[file.name] = { status: "pending", progress: 0 };
      });
      setBulkUploadProgress((prev) => ({ ...prev, ...newProgress }));
    }
  };

  const handleBulkFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      /\.(pdf|txt|md|csv|json|doc|docx)$/i.test(file.name)
    );
    if (files.length > 0) {
      setBulkFiles((prev) => [...prev, ...files]);
      const newProgress: Record<string, { status: "pending" | "uploading" | "done" | "error"; progress: number }> = {};
      files.forEach((file) => {
        newProgress[file.name] = { status: "pending", progress: 0 };
      });
      setBulkUploadProgress((prev) => ({ ...prev, ...newProgress }));
    }
  };

  const removeBulkFile = (fileName: string) => {
    setBulkFiles((prev) => prev.filter((f) => f.name !== fileName));
    setBulkUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) return;

    setIsBulkUploading(true);

    for (const file of bulkFiles) {
      // Update status to uploading
      setBulkUploadProgress((prev) => ({
        ...prev,
        [file.name]: { status: "uploading", progress: 0 },
      }));

      try {
        const formData = new FormData();
        formData.append("name", file.name.replace(/\.[^/.]+$/, ""));
        formData.append("source_type", "file");
        formData.append("chunk_size", bulkSettings.chunk_size.toString());
        formData.append("chunk_overlap", bulkSettings.chunk_overlap.toString());
        formData.append("embedding_model", bulkSettings.embedding_model);
        formData.append("file", file);

        // Simulate progress (since FormData doesn't provide progress)
        const progressInterval = setInterval(() => {
          setBulkUploadProgress((prev) => {
            const current = prev[file.name]?.progress || 0;
            if (current < 90) {
              return {
                ...prev,
                [file.name]: { ...prev[file.name], progress: current + 10 },
              };
            }
            return prev;
          });
        }, 200);

        await knowledgeApi.create(formData);

        clearInterval(progressInterval);

        // Update status to done
        setBulkUploadProgress((prev) => ({
          ...prev,
          [file.name]: { status: "done", progress: 100 },
        }));
      } catch (err: any) {
        // Update status to error
        setBulkUploadProgress((prev) => ({
          ...prev,
          [file.name]: {
            status: "error",
            progress: 0,
            error: err.response?.data?.detail || "Upload failed",
          },
        }));
      }
    }

    setIsBulkUploading(false);
    loadSources();
  };

  const resetBulkUpload = () => {
    setBulkFiles([]);
    setBulkUploadProgress({});
    setShowBulkUploadDialog(false);
  };

  const bulkUploadComplete = Object.values(bulkUploadProgress).every(
    (p) => p.status === "done" || p.status === "error"
  );

  const filteredSources = sources.filter(
    (source) =>
      source.name.toLowerCase().includes(search.toLowerCase()) ||
      source.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Knowledge Sources"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
            <FolderUp className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </div>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search knowledge sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No knowledge sources</h3>
            <p className="text-muted-foreground mb-4">
              Add documents, URLs, or text to create a knowledge base for your agents.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSources.map((source) => {
            const StatusIcon = statusConfig[source.status].icon;
            const FileIcon =
              source.file_type && fileTypeIcons[source.file_type]
                ? fileTypeIcons[source.file_type]
                : File;

            return (
              <Card
                key={source.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedSource(source);
                  setShowDetailDialog(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        {source.source_type === "file" ? (
                          <FileIcon className="h-5 w-5 text-primary" />
                        ) : source.source_type === "url" ? (
                          <Database className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{source.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {source.source_type}
                          {source.file_size && ` - ${formatFileSize(source.file_size)}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${statusConfig[source.status].color}`}>
                      <StatusIcon
                        className={`h-4 w-4 ${source.status === "processing" ? "animate-spin" : ""}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {source.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {source.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Layers className="h-3 w-3 mr-1" />
                        {source.chunk_count} chunks
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReprocess(source.id);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(source.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Knowledge Source</DialogTitle>
            <DialogDescription>
              Upload files, provide URLs, or add text content to create a knowledge base.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={createForm.source_type}
            onValueChange={(v) =>
              setCreateForm({ ...createForm, source_type: v as KnowledgeSource["source_type"] })
            }
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <Database className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Knowledge source name"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="embedding">Embedding Model</Label>
                  <Select
                    value={createForm.embedding_model}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, embedding_model: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-embedding-3-small">
                        text-embedding-3-small (OpenAI)
                      </SelectItem>
                      <SelectItem value="text-embedding-3-large">
                        text-embedding-3-large (OpenAI)
                      </SelectItem>
                      <SelectItem value="text-embedding-ada-002">
                        text-embedding-ada-002 (OpenAI)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Optional description"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                />
              </div>

              <TabsContent value="file" className="mt-0 space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-8 w-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, TXT, MD, CSV, JSON, DOC, DOCX
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://docs.example.com"
                    value={createForm.url}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, url: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to crawl and index. Supports HTML, PDF, and text files.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text_content">Text Content</Label>
                  <Textarea
                    id="text_content"
                    placeholder="Paste your text content here..."
                    rows={8}
                    value={createForm.text_content}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, text_content: e.target.value })
                    }
                  />
                </div>
              </TabsContent>

              {/* Chunking Configuration */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Chunking Configuration
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="chunk_size">Chunk Size (tokens)</Label>
                    <Input
                      id="chunk_size"
                      type="number"
                      min={100}
                      max={4000}
                      value={createForm.chunk_size}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          chunk_size: parseInt(e.target.value) || 1000,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chunk_overlap">Chunk Overlap (tokens)</Label>
                    <Input
                      id="chunk_overlap"
                      type="number"
                      min={0}
                      max={500}
                      value={createForm.chunk_overlap}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          chunk_overlap: parseInt(e.target.value) || 200,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                !createForm.name ||
                (createForm.source_type === "file" && !selectedFile) ||
                (createForm.source_type === "url" && !createForm.url) ||
                (createForm.source_type === "text" && !createForm.text_content)
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Source
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSource?.name}
              <Badge
                variant={selectedSource?.status === "ready" ? "default" : "secondary"}
                className="ml-2"
              >
                {selectedSource?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>{selectedSource?.description}</DialogDescription>
          </DialogHeader>

          {selectedSource && (
            <div className="space-y-4">
              {/* Source Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Source Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="capitalize">{selectedSource.source_type}</span>
                    </div>
                    {selectedSource.file_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">File</span>
                        <span>{selectedSource.file_name}</span>
                      </div>
                    )}
                    {selectedSource.file_size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size</span>
                        <span>{formatFileSize(selectedSource.file_size)}</span>
                      </div>
                    )}
                    {selectedSource.url && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">URL</span>
                        <a
                          href={selectedSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[200px]"
                        >
                          {selectedSource.url}
                        </a>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {new Date(selectedSource.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Processing Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chunks</span>
                      <span>{selectedSource.chunk_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chunk Size</span>
                      <span>{selectedSource.chunk_size} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overlap</span>
                      <span>{selectedSource.chunk_overlap} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Embedding</span>
                      <span className="text-xs font-mono">
                        {selectedSource.embedding_model}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedSource.status === "error" && selectedSource.error_message && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-700 dark:text-red-300">
                        Processing Error
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {selectedSource.error_message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleReprocess(selectedSource.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reprocess
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedSource.id);
                    setShowDetailDialog(false);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={(open) => {
        if (!open && !isBulkUploading) {
          resetBulkUpload();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderUp className="h-5 w-5" />
              Bulk Upload Files
            </DialogTitle>
            <DialogDescription>
              Upload multiple files at once to create knowledge sources.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop Zone */}
            {!isBulkUploading && bulkFiles.length === 0 && (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => bulkFileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBulkFileDrop}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
                  multiple
                  onChange={handleBulkFileSelect}
                />
                <FolderUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Drop files here or click to select</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF, TXT, MD, CSV, JSON, DOC, DOCX (multiple files supported)
                </p>
              </div>
            )}

            {/* File List */}
            {bulkFiles.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {bulkFiles.map((file) => {
                  const progress = bulkUploadProgress[file.name];
                  const FileIcon =
                    file.type && fileTypeIcons[file.type]
                      ? fileTypeIcons[file.type]
                      : File;

                  return (
                    <div
                      key={file.name}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        {progress && progress.status !== "pending" && (
                          <div className="mt-2">
                            {progress.status === "uploading" && (
                              <Progress value={progress.progress} className="h-1" />
                            )}
                            {progress.status === "error" && (
                              <p className="text-xs text-red-500">{progress.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {progress?.status === "done" && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {progress?.status === "error" && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {progress?.status === "uploading" && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                        {!isBulkUploading && progress?.status !== "done" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeBulkFile(file.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add More Files Button */}
            {bulkFiles.length > 0 && !isBulkUploading && !bulkUploadComplete && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => bulkFileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add More Files
              </Button>
            )}

            {/* Settings */}
            {bulkFiles.length > 0 && !isBulkUploading && !bulkUploadComplete && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Upload Settings (applies to all files)
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bulk_chunk_size">Chunk Size</Label>
                    <Input
                      id="bulk_chunk_size"
                      type="number"
                      min={100}
                      max={4000}
                      value={bulkSettings.chunk_size}
                      onChange={(e) =>
                        setBulkSettings({
                          ...bulkSettings,
                          chunk_size: parseInt(e.target.value) || 1000,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk_chunk_overlap">Overlap</Label>
                    <Input
                      id="bulk_chunk_overlap"
                      type="number"
                      min={0}
                      max={500}
                      value={bulkSettings.chunk_overlap}
                      onChange={(e) =>
                        setBulkSettings({
                          ...bulkSettings,
                          chunk_overlap: parseInt(e.target.value) || 200,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bulk_embedding">Embedding</Label>
                    <Select
                      value={bulkSettings.embedding_model}
                      onValueChange={(v) =>
                        setBulkSettings({ ...bulkSettings, embedding_model: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-embedding-3-small">
                          embedding-3-small
                        </SelectItem>
                        <SelectItem value="text-embedding-3-large">
                          embedding-3-large
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {bulkUploadComplete && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Upload complete!{" "}
                  {Object.values(bulkUploadProgress).filter((p) => p.status === "done").length} of{" "}
                  {bulkFiles.length} files uploaded successfully.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetBulkUpload}
              disabled={isBulkUploading}
            >
              {bulkUploadComplete ? "Close" : "Cancel"}
            </Button>
            {!bulkUploadComplete && (
              <Button
                onClick={handleBulkUpload}
                disabled={isBulkUploading || bulkFiles.length === 0}
              >
                {isBulkUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {bulkFiles.length} {bulkFiles.length === 1 ? "File" : "Files"}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
