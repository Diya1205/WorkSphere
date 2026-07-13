import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/reports")({
  component: () => (
    <ModulePlaceholder
      title="Reports"
      description="Filterable builder with saved templates and export"
      copy="Build reports across date ranges, departments and employees. Export to Excel/PDF and save templates for repeat runs."
    />
  ),
});
