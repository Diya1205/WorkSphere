import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Plus, Filter, CalendarDays, MessageSquare, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import {
  leaveService,
  type Leave,
  type LeaveType,
  type LeaveStatus,
} from "@/services/leaveService";

export const Route = createFileRoute("/_app/leave")({
  component: LeavePage,
  head: () => ({
    meta: [
      { title: "Leave · TirthInfotech" },
      { name: "description", content: "Apply for leave and track approvals." },
    ],
  }),
});

const LEAVE_TYPES: LeaveType[] = ["SICK", "CASUAL", "EMERGENCY", "PERSONAL"];

const leaveTypeLabel: Record<LeaveType, string> = {
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  EMERGENCY: "Emergency Leave",
  PERSONAL: "Personal Leave",
};

type Tab = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

function LeavePage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [showApply, setShowApply] = useState(false);
  const [drawer, setDrawer] = useState<Leave | null>(null);
  const [comment, setComment] = useState("");

  const canApprove = me?.role?.toUpperCase() === "ADMIN";


  const { data: requests = [], isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["leaves"],
    queryFn: leaveService.getLeaves,
  });

  const counts = useMemo(
    () => ({
      PENDING: requests.filter((r) => r.status === "PENDING").length,
      APPROVED: requests.filter((r) => r.status === "APPROVED").length,
      REJECTED: requests.filter((r) => r.status === "REJECTED").length,
      ALL: requests.length,
    }),
    [requests],
  );

  const filtered = tab === "ALL" ? requests : requests.filter((r) => r.status === tab);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["leaves"] });

  const applyMut = useMutation({
    mutationFn: leaveService.applyLeave,
    onSuccess: () => {
      invalidate();
      toast.success("Leave request submitted");
      setShowApply(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to submit leave"),
  });

  const approveMut = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      leaveService.approveLeave(id, { admin_remarks: remarks }),
    onSuccess: () => {
      invalidate();
      toast.success("Approved");
      setDrawer(null);
      setComment("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to approve"),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      leaveService.rejectLeave(id, { admin_remarks: remarks }),
    onSuccess: () => {
      invalidate();
      toast.error("Rejected");
      setDrawer(null);
      setComment("");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to reject"),
  });

  const deleteMut = useMutation({
    mutationFn: leaveService.deleteLeave,
    onSuccess: () => {
      invalidate();
      toast.success("Leave request deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to delete"),
  });

  const statusTone = (s: LeaveStatus) =>
    s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : s === "CANCELLED" ? "neutral" : "warning";

  return (
    <>
      <PageHeader
        title="Leave management"
        description={
          me?.role?.toUpperCase() === "EMPLOYEE"
            ? "Apply and track your own leave requests"
            : "Review and decide on every employee's leave requests"
        }
        breadcrumbs={[{ label: "Home" }, { label: "Time" }, { label: "Leave" }]}
        actions={
          <>
            {canApprove && (
              <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-accent">
                <CalendarDays className="h-4 w-4" /> Team calendar
              </button>
            )}
            <button
              onClick={() => setShowApply(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" /> Apply leave
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex gap-1">
              {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    tab === t ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t.toLowerCase()}
                  <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] tabular">{counts[t]}</span>
                </button>
              ))}
            </div>
            <button className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:bg-accent">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
          </div>

          <div className="overflow-x-auto">
            {meLoading || isLoading ? (
              <div className="grid place-items-center py-16 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No {tab === "ALL" ? "" : tab.toLowerCase()} requests
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Applied</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => {
                    const isOwner = r.employee_name && me?.fullName === r.employee_name;
                    return (
                      <tr key={r.id} className="hover:bg-accent/40" onClick={() => setDrawer(r)} role="button">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.employee_name} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground">{r.employee_name}</div>
                              <div className="truncate text-xs text-muted-foreground">{r.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip tone="neutral" dot={false}>{leaveTypeLabel[r.leave_type]}</StatusChip>
                        </td>
                        <td className="px-4 py-3 tabular text-muted-foreground">
                          {r.start_date} → {r.end_date}
                        </td>
                        <td className="px-4 py-3 tabular font-medium">{r.days}</td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{r.applied_at.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <StatusChip tone={statusTone(r.status)}>{r.status.toLowerCase()}</StatusChip>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canApprove && r.status === "PENDING" ? (
                            <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => rejectMut.mutate({ id: r.id })}
                                className="grid h-8 w-8 place-items-center rounded-md border border-border text-danger hover:bg-danger-soft"
                                aria-label="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => approveMut.mutate({ id: r.id })}
                                className="grid h-8 w-8 place-items-center rounded-md bg-success text-success-foreground hover:bg-success/90"
                                aria-label="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {r.approved_by_name ? `by ${r.approved_by_name}` : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showApply && me && (
        <ApplyDrawer
          onClose={() => setShowApply(false)}
          onSubmit={(v) => applyMut.mutate(v)}
          submitting={applyMut.isPending}
        />
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold">Leave request</h3>
              <button onClick={() => setDrawer(null)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="flex items-center gap-3">
                <Avatar name={drawer.employee_name} size="lg" />
                <div className="min-w-0">
                  <div className="font-semibold">{drawer.employee_name}</div>
                  <div className="text-xs text-muted-foreground">{drawer.employee_code}</div>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-background/50 p-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="font-medium">{leaveTypeLabel[drawer.leave_type]}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Days</dt><dd className="tabular font-medium">{drawer.days}</dd></div>
                <div><dt className="text-xs text-muted-foreground">From</dt><dd className="tabular font-medium">{drawer.start_date}</dd></div>
                <div><dt className="text-xs text-muted-foreground">To</dt><dd className="tabular font-medium">{drawer.end_date}</dd></div>
              </dl>
              {drawer.reason && (
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</div>
                  <p className="text-sm text-foreground">{drawer.reason}</p>
                </div>
              )}
              {canApprove && drawer.status === "PENDING" && (
                <label className="block text-sm">
                  <span className="mb-1.5 flex items-center gap-1.5 font-medium">
                    <MessageSquare className="h-3.5 w-3.5" /> Add a remark (optional)
                  </span>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
              )}
              {drawer.admin_remarks && (
                <div className="rounded-md border border-border bg-background/60 p-3 text-sm">
                  <div className="text-xs text-muted-foreground">Admin remarks</div>
                  <div className="mt-1">{drawer.admin_remarks}</div>
                </div>
              )}
              {drawer.status === "PENDING" && !canApprove && (
                <button
                  onClick={() => deleteMut.mutate(drawer.id)}
                  className="h-9 w-full rounded-md border border-danger/30 bg-surface text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  Delete request
                </button>
              )}
            </div>
            {canApprove && drawer.status === "PENDING" && (
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button
                  onClick={() => rejectMut.mutate({ id: drawer.id, remarks: comment })}
                  className="h-9 rounded-md border border-danger/30 bg-surface px-4 text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  Reject
                </button>
                <button
                  onClick={() => approveMut.mutate({ id: drawer.id, remarks: comment })}
                  className="h-9 rounded-md bg-success px-4 text-sm font-medium text-success-foreground hover:bg-success/90"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ApplyDrawer({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (v: { leave_type: LeaveType; start_date: string; end_date: string; reason: string }) => void;
  submitting: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reason, setReason] = useState("");
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) {
            toast.error("Reason is required");
            return;
          }
          if (start < today) {
              toast.error("You cannot apply leave for past dates.");
              return;
          }
          if (start > end) {
            toast.error("Start date must be before or equal to end date");
            return;
          }
          onSubmit({ leave_type: leaveType, start_date: start, end_date: end, reason });
        }}
        className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">Apply for leave</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Leave type</span>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{leaveTypeLabel[t]}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">From</span>
              <input
                type="date"
                required
                value={start}
                min={today}
                onChange={(e) => setStart(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">To</span>
              <input
                type="date"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                min={start}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Reason</span>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add context for your manager…"
              className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="rounded-md border border-info/30 bg-info-soft p-3 text-xs text-info">
            Requesting <span className="tabular font-semibold">{days} day{days > 1 ? "s" : ""}</span>.
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}