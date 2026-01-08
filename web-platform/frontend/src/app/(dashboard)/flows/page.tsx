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
  GitBranch,
  Play,
} from "lucide-react";
import Link from "next/link";

// Mock data
const flows = [
  {
    id: "1",
    name: "Content Pipeline",
    description: "Research, write, and publish content automatically",
    steps_count: 5,
    is_deployed: true,
    environment: "production",
  },
  {
    id: "2",
    name: "Data Processing Flow",
    description: "Ingest, process, and analyze data",
    steps_count: 4,
    is_deployed: false,
    environment: "development",
  },
  {
    id: "3",
    name: "Customer Onboarding",
    description: "Automated customer onboarding workflow",
    steps_count: 6,
    is_deployed: true,
    environment: "staging",
  },
];

export default function FlowsPage() {
  const [search, setSearch] = useState("");

  const filteredFlows = flows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(search.toLowerCase()) ||
      flow.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Flows"
      actions={
        <Button asChild>
          <Link href="/flows/new">
            <Plus className="mr-2 h-4 w-4" />
            New Flow
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Flows Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFlows.map((flow) => (
          <Card key={flow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{flow.name}</CardTitle>
                  <CardDescription>{flow.steps_count} steps</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
                <Button size="sm" className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/flows/${flow.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
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
          <h3 className="text-lg font-medium">No flows found</h3>
          <p className="text-muted-foreground">
            Create your first flow to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/flows/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Flow
            </Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
