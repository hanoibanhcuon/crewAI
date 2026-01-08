"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { AgentForm } from "@/components/agents";
import { agentsApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await agentsApi.get(agentId);
        setAgent(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load agent");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
  }, [agentId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Agent">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Edit Agent">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/agents")}
            className="text-primary hover:underline"
          >
            Back to Agents
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit: ${agent?.name}`}>
      <div className="max-w-4xl">
        <AgentForm
          agentId={agentId}
          initialData={{
            name: agent.name,
            description: agent.description || "",
            role: agent.role,
            goal: agent.goal,
            backstory: agent.backstory || "",
            llm_provider: agent.llm_provider,
            llm_model: agent.llm_model,
            temperature: agent.temperature,
            max_tokens: agent.max_tokens,
            verbose: agent.verbose,
            allow_delegation: agent.allow_delegation,
            max_iter: agent.max_iter,
            max_rpm: agent.max_rpm,
            max_retry_limit: agent.max_retry_limit,
            memory_enabled: agent.memory_enabled,
            memory_type: agent.memory_type,
            allow_code_execution: agent.allow_code_execution,
            code_execution_mode: agent.code_execution_mode,
            system_prompt: agent.system_prompt || "",
            tool_ids: agent.tools?.map((t: any) => t.tool_id) || [],
            is_public: agent.is_public,
            tags: agent.tags || [],
          }}
        />
      </div>
    </DashboardLayout>
  );
}
