import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/performance")({
  component: () => (
    <ModulePlaceholder
      title="Performance"
      description="OKR tracking, 360° feedback and review cycles"
      copy="This module houses OKR progress, review cycles, 360° feedback forms, radar-chart ratings and promotion history for every employee."
    />
  ),
});
