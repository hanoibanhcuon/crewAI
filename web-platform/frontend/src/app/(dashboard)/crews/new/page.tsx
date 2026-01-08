"use client";

import { DashboardLayout } from "@/components/layout";
import { CrewBuilder } from "@/components/crews";

export default function NewCrewPage() {
  return (
    <DashboardLayout title="Create Crew">
      <div className="max-w-5xl">
        <CrewBuilder />
      </div>
    </DashboardLayout>
  );
}
