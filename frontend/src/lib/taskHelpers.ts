/* -------------------------------------------------------------------------- */
/*  Shared Task module constants & helpers                                    */
/*  Used by: tasks list page, task details page, TaskForm                     */
/* -------------------------------------------------------------------------- */

export const STATUS_COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
] as const;

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export function statusLabel(status: string) {
  return STATUS_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Plain design-system tokens. Swap these for your real design-system
// tokens/components (Cards, Buttons, Inputs, Badges, StatusChip) as they
// become available — the Task module intentionally has zero one-off colors
// baked into JSX so that swap is a single-file change.
import { authStorage } from "@/lib/auth-storage";
export const colors = {
  bg: "#ffffff",
  border: "#d1d5db",
  text: "#111827",
  subtext: "#6b7280",
  page: "#f3f4f6",
  primary: "#2563eb",
  primaryText: "#ffffff",
  danger: "#b91c1c",
};

export function getCurrentUser(): { role?: string; employee_id?: number } {
  try {
    return JSON.parse(authStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}