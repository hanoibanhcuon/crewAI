"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

// Mock data
const executions = [
  {
    id: "1",
    name: "Research & Writing Crew",
    type: "crew",
    status: "completed",
    started_at: "2025-01-08 10:30:00",
    duration: "2m 34s",
    tokens: 4523,
    cost: 0.12,
  },
  {
    id: "2",
    name: "Content Pipeline",
    type: "flow",
    status: "running",
    started_at: "2025-01-08 10:45:00",
    duration: "Running...",
    tokens: 1234,
    cost: 0.04,
  },
  {
    id: "3",
    name: "Data Analysis Crew",
    type: "crew",
    status: "failed",
    started_at: "2025-01-08 09:15:00",
    duration: "45s",
    tokens: 892,
    cost: 0.02,
    error: "API rate limit exceeded",
  },
  {
    id: "4",
    name: "Customer Support Crew",
    type: "crew",
    status: "waiting_human",
    started_at: "2025-01-08 09:00:00",
    duration: "Waiting...",
    tokens: 2341,
    cost: 0.06,
  },
];

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900",
    label: "Completed",
  },
  running: {
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900",
    label: "Running",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900",
    label: "Failed",
  },
  waiting_human: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900",
    label: "Waiting for Input",
  },
};

export default function ExecutionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredExecutions = executions.filter((execution) => {
    const matchesSearch = execution.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Executions">
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search executions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              <config.icon className={`mr-2 h-4 w-4 ${config.color}`} />
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium">Type</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Started</th>
                  <th className="p-4 text-left text-sm font-medium">Duration</th>
                  <th className="p-4 text-left text-sm font-medium">Tokens</th>
                  <th className="p-4 text-left text-sm font-medium">Cost</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((execution) => {
                  const status = statusConfig[execution.status as keyof typeof statusConfig];
                  return (
                    <tr key={execution.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{execution.name}</div>
                        {execution.error && (
                          <div className="text-sm text-red-500">{execution.error}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="capitalize">{execution.type}</span>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg}`}>
                          <status.icon className={`h-3 w-3 ${status.color}`} />
                          {status.label}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {execution.started_at}
                      </td>
                      <td className="p-4 text-sm">{execution.duration}</td>
                      <td className="p-4 text-sm">{execution.tokens.toLocaleString()}</td>
                      <td className="p-4 text-sm">${execution.cost.toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/executions/${execution.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {execution.status === "failed" && (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredExecutions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Play className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No executions found</h3>
          <p className="text-muted-foreground">
            Run a crew or flow to see executions here
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
