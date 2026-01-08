"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { CrewBuilder } from "@/components/crews";
import { crewsApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EditCrewPage() {
  const params = useParams();
  const router = useRouter();
  const crewId = params.id as string;

  const [crew, setCrew] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const response = await crewsApi.get(crewId);
        setCrew(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load crew");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrew();
  }, [crewId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Crew">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Edit Crew">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/crews")}
            className="text-primary hover:underline"
          >
            Back to Crews
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit: ${crew?.name}`}>
      <div className="max-w-5xl">
        <CrewBuilder
          crewId={crewId}
          initialData={{
            name: crew.name,
            description: crew.description || "",
            process: crew.process,
            verbose: crew.verbose,
            manager_agent_id: crew.manager_agent_id,
            manager_llm: crew.manager_llm || "gpt-4",
            respect_context_window: crew.respect_context_window,
            memory_enabled: crew.memory_enabled,
            cache_enabled: crew.cache_enabled,
            max_rpm: crew.max_rpm,
            full_output: crew.full_output,
            planning: crew.planning,
            planning_llm: crew.planning_llm || "gpt-4",
            stream: crew.stream,
            output_log_file: crew.output_log_file || "",
            agents:
              crew.agents?.map((a: any) => ({
                agent_id: a.agent_id,
                order: a.order,
                config_override: a.config_override || {},
              })) || [],
            tasks:
              crew.tasks?.map((t: any) => ({
                task_id: t.task_id,
                order: t.order,
                config_override: t.config_override || {},
              })) || [],
            is_public: crew.is_public,
            tags: crew.tags || [],
          }}
        />
      </div>
    </DashboardLayout>
  );
}
