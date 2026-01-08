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
  ListTodo,
} from "lucide-react";
import Link from "next/link";

// Mock data
const tasks = [
  {
    id: "1",
    name: "Research Task",
    description: "Conduct thorough research on the given topic",
    expected_output: "A comprehensive report with key findings",
    agent_name: "Research Analyst",
    human_input: false,
  },
  {
    id: "2",
    name: "Write Blog Post",
    description: "Write an engaging blog post based on research",
    expected_output: "A 1000-word blog post in markdown format",
    agent_name: "Content Writer",
    human_input: true,
  },
  {
    id: "3",
    name: "Data Analysis",
    description: "Analyze the provided dataset and extract insights",
    expected_output: "Statistical analysis with visualizations",
    agent_name: "Data Analyst",
    human_input: false,
  },
];

export default function TasksPage() {
  const [search, setSearch] = useState("");

  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Tasks"
      actions={
        <Button asChild>
          <Link href="/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      }
    >
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <ListTodo className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <CardDescription>Assigned to: {task.agent_name}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
              <p className="text-sm mb-4">
                <span className="font-medium">Expected:</span> {task.expected_output}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {task.human_input && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2.5 py-0.5 text-xs font-medium">
                    Human Input Required
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/tasks/${task.id}`}>
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

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground">
            Create your first task to get started
          </p>
          <Button className="mt-4" asChild>
            <Link href="/tasks/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Link>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
