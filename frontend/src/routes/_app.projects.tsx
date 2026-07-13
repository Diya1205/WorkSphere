import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/projects")({
  component: () => (
    <ModulePlaceholder
      title="Projects"
      description="Track projects with Gantt timelines, budgets and document repositories"
      copy="The Projects module lists active initiatives, milestone trackers, budget vs. actual charts, and per-project document libraries. Wire your project data source to populate this view."
    />
  ),
});
