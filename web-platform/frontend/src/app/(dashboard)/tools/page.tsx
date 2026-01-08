"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Wrench,
  Globe,
  Database,
  FileText,
  Code,
  Image,
} from "lucide-react";
import Link from "next/link";

// Mock data - built-in tools
const toolCategories = [
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

      {/* Tools by Category */}
      <div className="space-y-8">
        {toolCategories.map((category) => (
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
                        <CardTitle className="text-base">{tool.name}</CardTitle>
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
    </DashboardLayout>
  );
}
