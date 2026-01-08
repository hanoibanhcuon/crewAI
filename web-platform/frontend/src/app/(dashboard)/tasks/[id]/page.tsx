"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { TaskForm } from "@/components/tasks";
import { tasksApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await tasksApi.get(taskId);
        setTask(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Task">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Edit Task">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/tasks")}
            className="text-primary hover:underline"
          >
            Back to Tasks
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit: ${task?.name}`}>
      <div className="max-w-4xl">
        <TaskForm
          taskId={taskId}
          initialData={{
            name: task.name,
            description: task.description,
            expected_output: task.expected_output,
            agent_id: task.agent_id,
            async_execution: task.async_execution,
            human_input: task.human_input,
            markdown: task.markdown,
            output_file: task.output_file || "",
            output_json_schema: task.output_json_schema
              ? JSON.stringify(task.output_json_schema, null, 2)
              : "",
            output_pydantic_model: task.output_pydantic_model || "",
            create_directory: task.create_directory,
            callback_url: task.callback_url || "",
            guardrail_max_retries: task.guardrail_max_retries,
            tools: task.tools || [],
            dependency_ids:
              task.dependencies?.map((d: any) => d.depends_on_id) || [],
            is_public: task.is_public,
            tags: task.tags || [],
          }}
        />
      </div>
    </DashboardLayout>
  );
}
