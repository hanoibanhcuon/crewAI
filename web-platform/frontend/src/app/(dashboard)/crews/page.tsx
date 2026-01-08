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
  Layers,
  Play,
  Rocket,
} from "lucide-react";
import Link from "next/link";

// Mock data
const crews = [
  {
    id: "1",
    name: "Research & Writing Crew",
    description: "A crew for researching topics and writing content",
    process: "sequential",
    agents_count: 2,
    tasks_count: 3,
    is_deployed: true,
    environment: "production",
  },
  {
    id: "2",
    name: "Data Analysis Crew",
    description: "Analyze data and generate reports",
    process: "hierarchical",
    agents_count: 3,
    tasks_count: 4,
    is_deployed: false,
    environment: "development",
  },
  {
    id: "3",
    name: "Customer Support Crew",
    description: "Handle customer inquiries and support tickets",
    process: "sequential",
    agents_count: 2,
    tasks_count: 2,
    is_deployed: true,
    environment: "staging",
  },
];

export default function CrewsPage() {
  const [search, setSearch] = useState("");

  const filteredCrews = crews.filter(
    (crew) =>
      crew.name.toLowerCase().includes(search.toLowerCase()) ||
      crew.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Crews"
      actions={
        <Button asChild>
          <Link href="/crews/new">
            <Plus className="mr-2 h-4 w-4" />
            New Crew
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search crews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Crews Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCrews.map((crew) => (
          <Card key={crew.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{crew.name}</CardTitle>
                  <CardDescription className="capitalize">{crew.process} process</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{crew.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {crew.agents_count} agents
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  {crew.tasks_count} tasks
                </span>
                {crew.is_deployed && (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2.5 py-0.5 text-xs font-medium">
                    {crew.environment}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/crews/${crew.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm">
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
          <h3 className="text-lg font-medium">No crews found</h3>
          <p className="text-muted-foreground">
            Create your first crew to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/crews/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Crew
            </Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
