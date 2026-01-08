"use client";

import { DashboardLayout } from "@/components/layout";
import { AgentForm } from "@/components/agents";

export default function NewAgentPage() {
  return (
    <DashboardLayout title="Create Agent">
      <div className="max-w-4xl">
        <AgentForm />
      </div>
    </DashboardLayout>
  );
}
