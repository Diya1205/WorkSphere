import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/documents")({
  component: () => (
    <ModulePlaceholder
      title="Documents"
      description="Categorized library with e-signature and versioning"
      copy="Offer letters, experience letters, contracts and policies live here with PDF preview, e-signature and version history."
    />
  ),
});
