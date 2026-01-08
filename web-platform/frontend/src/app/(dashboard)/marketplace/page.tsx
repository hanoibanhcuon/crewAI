"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { templatesApi } from "@/lib/api";
import {
  Search,
  Store,
  Download,
  Star,
  Heart,
  Users,
  Layers,
  GitBranch,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description?: string;
  template_type: string;
  author_name?: string;
  downloads: number;
  likes: number;
  rating: number;
  tags: string[];
  is_featured: boolean;
}

// Mock data fallback
const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Nghiên cứu & Viết nội dung",
    description: "Một đội nhóm hoàn chỉnh để nghiên cứu chủ đề và viết nội dung chất lượng cao",
    template_type: "crew",
    author_name: "CrewAI Team",
    downloads: 1234,
    likes: 89,
    rating: 4.8,
    tags: ["nội dung", "nghiên cứu", "viết bài"],
    is_featured: true,
  },
  {
    id: "2",
    name: "Quy trình phân tích dữ liệu",
    description: "Phân tích dữ liệu tự động và tạo báo cáo",
    template_type: "flow",
    author_name: "Data Expert",
    downloads: 856,
    likes: 67,
    rating: 4.6,
    tags: ["dữ liệu", "phân tích", "tự động hóa"],
    is_featured: true,
  },
  {
    id: "3",
    name: "Tác nhân hỗ trợ khách hàng",
    description: "Tác nhân AI để xử lý yêu cầu và hỗ trợ khách hàng",
    template_type: "agent",
    author_name: "Support Pro",
    downloads: 2341,
    likes: 156,
    rating: 4.9,
    tags: ["hỗ trợ", "khách hàng", "chatbot"],
    is_featured: false,
  },
  {
    id: "4",
    name: "Đội tối ưu hóa SEO",
    description: "Phân tích và tối ưu hóa nội dung cho công cụ tìm kiếm",
    template_type: "crew",
    author_name: "SEO Master",
    downloads: 678,
    likes: 45,
    rating: 4.5,
    tags: ["seo", "tối ưu hóa", "nội dung"],
    is_featured: false,
  },
];

const typeIcons = {
  crew: Layers,
  flow: GitBranch,
  agent: Users,
};

const typeLabels: Record<string, string> = {
  crew: "Đội nhóm",
  flow: "Quy trình",
  agent: "Tác nhân",
};

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await templatesApi.list({
        template_type: typeFilter || undefined,
        search: search || undefined,
      });
      setTemplates(response.data?.items || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
      // Use mock data as fallback
      setTemplates(mockTemplates);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadTemplates]);

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || template.template_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const featuredTemplates = filteredTemplates.filter((t) => t.is_featured);
  const otherTemplates = filteredTemplates.filter((t) => !t.is_featured);

  return (
    <DashboardLayout
      title="Chợ ứng dụng"
      actions={
        <Button asChild>
          <Link href="/marketplace/new">
            <Plus className="mr-2 h-4 w-4" />
            Đăng mẫu
          </Link>
        </Button>
      }
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mẫu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(null)}
          >
            Tất cả
          </Button>
          <Button
            variant={typeFilter === "crew" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("crew")}
          >
            <Layers className="mr-2 h-4 w-4" />
            Đội nhóm
          </Button>
          <Button
            variant={typeFilter === "flow" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("flow")}
          >
            <GitBranch className="mr-2 h-4 w-4" />
            Quy trình
          </Button>
          <Button
            variant={typeFilter === "agent" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter("agent")}
          >
            <Users className="mr-2 h-4 w-4" />
            Tác nhân
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Featured Templates */}
          {featuredTemplates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Mẫu nổi bật
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {featuredTemplates.map((template) => {
                  const TypeIcon = typeIcons[template.template_type as keyof typeof typeIcons] || Layers;
                  return (
                    <Link key={template.id} href={`/marketplace/${template.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                                <TypeIcon className="h-6 w-6 text-primary-foreground" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription>bởi {template.author_name || "Không rõ"}</CardDescription>
                              </div>
                            </div>
                            <span className="capitalize text-xs bg-secondary px-2 py-1 rounded">
                              {typeLabels[template.template_type] || template.template_type}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {template.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-accent px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Download className="h-4 w-4" />
                                {template.downloads}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {template.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {template.rating}
                              </span>
                            </div>
                            <Button size="sm">Sử dụng mẫu</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Tất cả mẫu</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherTemplates.map((template) => {
                const TypeIcon = typeIcons[template.template_type as keyof typeof typeIcons] || Layers;
                return (
                  <Link key={template.id} href={`/marketplace/${template.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-xs">bởi {template.author_name || "Không rõ"}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {template.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {template.rating}
                            </span>
                          </div>
                          <Button size="sm" variant="outline">Sử dụng</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Không tìm thấy mẫu</h3>
              <p className="text-muted-foreground">
                Thử điều chỉnh tìm kiếm hoặc bộ lọc
              </p>
              <Button className="mt-4" asChild>
                <Link href="/marketplace/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Đăng mẫu đầu tiên của bạn
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
