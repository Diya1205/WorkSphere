import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/components/hrms/ModulePlaceholder";

export const Route = createFileRoute("/_app/expenses")({
  component: () => (
    <ModulePlaceholder
      title="Expenses"
      description="Claims, approvals and reimbursements"
      copy="Employees submit claims with receipt OCR, then travel through multi-level approvals and reimbursement tracking."
    />
  ),
});
