"use client";

import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ListTodo,
  Layers,
  GitBranch,
  Play,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    name: "Total Agents",
    value: "12",
    change: "+2 this week",
    icon: Users,
    href: "/agents",
  },
  {
    name: "Total Tasks",
    value: "28",
    change: "+5 this week",
    icon: ListTodo,
    href: "/tasks",
  },
  {
    name: "Active Crews",
    value: "6",
    change: "+1 this week",
    icon: Layers,
    href: "/crews",
  },
  {
    name: "Flows",
    value: "4",
    change: "No change",
    icon: GitBranch,
    href: "/flows",
  },
];

const recentExecutions = [
  {
    id: "1",
    name: "Research Crew",
    status: "completed",
    duration: "2m 34s",
    timestamp: "5 minutes ago",
  },
  {
    id: "2",
    name: "Content Writer Flow",
    status: "running",
    duration: "1m 12s",
    timestamp: "Running",
  },
  {
    id: "3",
    name: "Data Analysis Crew",
    status: "failed",
    duration: "45s",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    name: "Customer Support Agent",
    status: "completed",
    duration: "3m 21s",
    timestamp: "2 hours ago",
  },
];

const quickActions = [
  { name: "Create Agent", icon: Users, href: "/agents/new" },
  { name: "Create Task", icon: ListTodo, href: "/tasks/new" },
  { name: "Create Crew", icon: Layers, href: "/crews/new" },
  { name: "Create Flow", icon: GitBranch, href: "/flows/new" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <Button asChild>
          <Link href="/crews/new">
            <Plus className="mr-2 h-4 w-4" />
            New Crew
          </Link>
        </Button>
      }
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Recent Executions
            </CardTitle>
            <CardDescription>
              Your latest crew and flow executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {execution.status === "completed" && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {execution.status === "running" && (
                      <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                    )}
                    {execution.status === "failed" && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{execution.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {execution.duration}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {execution.timestamp}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/executions">View All Executions</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Create new resources quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <action.icon className="h-8 w-8 text-primary mb-2" />
                      <span className="font-medium text-center">
                        {action.name}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Getting Started with CrewAI</CardTitle>
          <CardDescription>
            Follow these steps to build your first AI agent crew
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-4 rounded-lg border p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Create Agents</h4>
                <p className="text-sm text-muted-foreground">
                  Define AI agents with roles, goals, and tools
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Create Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Define tasks with descriptions and expected outputs
                </p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Build Crews</h4>
                <p className="text-sm text-muted-foreground">
                  Combine agents and tasks into powerful crews
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
