import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/meetings")({
  component: () => (
    <ModulePlaceholder
      title="Meetings"
      description="Scheduler, agendas and notes"
      copy="Meeting scheduler with calendar integration, video links, agendas, notes editor and RSVP tracking lives here."
    />
  ),
});
