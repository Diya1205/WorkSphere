import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/messages")({
  component: () => (
    <ModulePlaceholder
      title="Messages"
      description="Channels, DMs and company-wide announcements"
      copy="Team channels, direct messages, typing indicators, file sharing and audience-targeted announcements sit inside this module."
    />
  ),
});
