"use client";

import { DashboardLayout } from "@/components/layout";
import { TaskForm } from "@/components/tasks";

export default function NewTaskPage() {
  return (
    <DashboardLayout title="Create Task">
      <div className="max-w-4xl">
        <TaskForm />
      </div>
    </DashboardLayout>
  );
}
