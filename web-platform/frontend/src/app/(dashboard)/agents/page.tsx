"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  Bot,
} from "lucide-react";
import Link from "next/link";

// Mock data
const agents = [
  {
    id: "1",
    name: "Research Analyst",
    role: "Senior Research Analyst",
    goal: "Find and analyze data from various sources",
    llm_model: "gpt-4",
    tools: ["SerperDevTool", "WebsiteSearchTool"],
    is_active: true,
  },
  {
    id: "2",
    name: "Content Writer",
    role: "Professional Content Writer",
    goal: "Create engaging and informative content",
    llm_model: "gpt-4",
    tools: [],
    is_active: true,
  },
  {
    id: "3",
    name: "Data Analyst",
    role: "Data Analysis Expert",
    goal: "Process and analyze data to extract insights",
    llm_model: "gpt-4-turbo",
    tools: ["CodeInterpreterTool"],
    is_active: true,
  },
];

export default function AgentsPage() {
  const [search, setSearch] = useState("");

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Agents"
      actions={
        <Button asChild>
          <Link href="/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            New Agent
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
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
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{agent.goal}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {agent.llm_model}
                </span>
                {agent.tools.map((tool) => (
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
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No agents found</h3>
          <p className="text-muted-foreground">
            Create your first agent to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
