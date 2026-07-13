import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Plus, Filter, CalendarDays, MessageSquare, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leave")({
  component: LeavePage,
  head: () => ({
    meta: [
      { title: "Leave · Northwind IT" },
      { name: "description", content: "Apply for leave, review pending approvals, and track team balances." },
    ],
  }),
});

const sb = supabase as any;
type Status = "pending" | "approved" | "rejected";
type LeaveRow = {
  id: string; user_id: string; leave_type: string; start_date: string; end_date: string;
  days: number; reason: string | null; status: Status;
  approver_id: string | null; approver_comment: string | null; created_at: string;
};

function LeavePage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [showApply, setShowApply] = useState(false);
  const [drawer, setDrawer] = useState<LeaveRow | null>(null);
  const [comment, setComment] = useState("");

  const canApprove = me?.role === "admin" || me?.role === "manager";

  const { data: requests = [], isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["leave_requests", me?.id, me?.role],
    queryFn: async (): Promise<LeaveRow[]> => {
      // RLS enforces scoping; we also explicitly filter for employee to make the intent clear.
      let q = sb.from("leave_requests").select("*").order("created_at", { ascending: false });
      if (me?.role === "employee") q = q.eq("user_id", me.id);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    enabled: !!me,
    queryKey: ["profiles-lite"],
    queryFn: async () => (await sb.from("profiles").select("id, full_name, job_title, department, avatar_color")).data ?? [],
  });
  const findProfile = (id: string) => profiles.find((p: any) => p.id === id);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  }), [requests]);

  const filtered = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  const decideMut = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: Status; note?: string }) => {
      const { error } = await sb.from("leave_requests").update({
        status, approver_id: me!.id, approver_comment: note ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["leave_requests"] });
      toast[v.status === "approved" ? "success" : "error"](v.status === "approved" ? "Approved" : "Rejected");
      setDrawer(null); setComment("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const applyMut = useMutation({
    mutationFn: async (payload: Omit<LeaveRow, "id" | "created_at" | "user_id" | "status" | "approver_id" | "approver_comment">) => {
      const { error } = await sb.from("leave_requests").insert({ ...payload, user_id: me!.id, status: "pending" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave_requests"] });
      toast.success("Leave request submitted");
      setShowApply(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const decide = (id: string, status: Status, note?: string) => decideMut.mutate({ id, status, note });

  return (
    <>
      <PageHeader
        title="Leave management"
        description={me?.role === "employee" ? "Apply and track your own time-off" : "Apply, approve and track time-off across the org"}
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
        {/* Balance strip (live-derived from own approved leaves) */}
        <BalanceStrip requests={requests.filter((r) => r.user_id === me?.id)} />

        {/* Tabs + table */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex gap-1">
              {(["pending", "approved", "rejected", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    tab === t ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {t}
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
              <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No {tab === "all" ? "" : tab} requests</div>
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
                    const p = findProfile(r.user_id);
                    const name = p?.full_name ?? "Unknown";
                    return (
                      <tr key={r.id} className="hover:bg-accent/40" onClick={() => setDrawer(r)} role="button">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} color={p?.avatar_color} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-foreground">{name}</div>
                              <div className="truncate text-xs text-muted-foreground">{p?.job_title ?? p?.department ?? ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusChip tone="neutral" dot={false}>{r.leave_type}</StatusChip></td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{r.start_date} → {r.end_date}</td>
                        <td className="px-4 py-3 tabular font-medium">{r.days}</td>
                        <td className="px-4 py-3 tabular text-muted-foreground">{r.created_at.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <StatusChip tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                            {r.status}
                          </StatusChip>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canApprove && r.status === "pending" ? (
                            <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => decide(r.id, "rejected")} className="grid h-8 w-8 place-items-center rounded-md border border-border text-danger hover:bg-danger-soft" aria-label="Reject">
                                <X className="h-4 w-4" />
                              </button>
                              <button onClick={() => decide(r.id, "approved")} className="grid h-8 w-8 place-items-center rounded-md bg-success text-success-foreground hover:bg-success/90" aria-label="Approve">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {r.approver_id ? `by ${findProfile(r.approver_id)?.full_name ?? "manager"}` : "—"}
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
              {(() => {
                const p = findProfile(drawer.user_id);
                const name = p?.full_name ?? "Unknown";
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar name={name} color={p?.avatar_color} size="lg" />
                      <div className="min-w-0">
                        <div className="font-semibold">{name}</div>
                        <div className="text-xs text-muted-foreground">{p?.job_title ?? ""} · {p?.department ?? ""}</div>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-background/50 p-4 text-sm">
                      <div><dt className="text-xs text-muted-foreground">Type</dt><dd className="font-medium">{drawer.leave_type}</dd></div>
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
                    {canApprove && drawer.status === "pending" && (
                      <label className="block text-sm">
                        <span className="mb-1.5 flex items-center gap-1.5 font-medium"><MessageSquare className="h-3.5 w-3.5" /> Add a comment (optional)</span>
                        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                      </label>
                    )}
                    {drawer.approver_comment && (
                      <div className="rounded-md border border-border bg-background/60 p-3 text-sm">
                        <div className="text-xs text-muted-foreground">Approver said</div>
                        <div className="mt-1">{drawer.approver_comment}</div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            {canApprove && drawer.status === "pending" && (
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
                <button onClick={() => decide(drawer.id, "rejected", comment)} className="h-9 rounded-md border border-danger/30 bg-surface px-4 text-sm font-medium text-danger hover:bg-danger-soft">Reject</button>
                <button onClick={() => decide(drawer.id, "approved", comment)} className="h-9 rounded-md bg-success px-4 text-sm font-medium text-success-foreground hover:bg-success/90">Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BalanceStrip({ requests }: { requests: LeaveRow[] }) {
  const used = (type: string) => requests.filter((r) => r.status === "approved" && r.leave_type === type).reduce((s, r) => s + Number(r.days), 0);
  const bal = [
    { label: "Casual", used: used("Casual"), total: 8, tone: "primary" },
    { label: "Sick", used: used("Sick"), total: 12, tone: "info" },
    { label: "Earned", used: used("Earned"), total: 20, tone: "success" },
    { label: "Comp-off", used: used("Comp-off"), total: 3, tone: "warning" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {bal.map((b) => {
        const pct = Math.min(100, (b.used / b.total) * 100);
        return (
          <div key={b.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{b.label} leave</span><span className="tabular">{b.used} / {b.total} used</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular text-foreground">{b.total - b.used}</span>
              <span className="text-xs text-muted-foreground">days left</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", `bg-${b.tone}`)} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApplyDrawer({ onClose, onSubmit, submitting }: { onClose: () => void; onSubmit: (v: any) => void; submitting: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const [leaveType, setLeaveType] = useState("Casual");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reason, setReason] = useState("");
  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit({ leave_type: leaveType, start_date: start, end_date: end, days, reason }); }}
        className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-semibold">Apply for leave</h3>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Leave type</span>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">
              <option>Casual</option><option>Sick</option><option>Earned</option><option>Comp-off</option><option>Unpaid</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm"><span className="mb-1.5 block font-medium">From</span>
              <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium">To</span>
              <input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} min={start} className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Reason</span>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add context for your manager…" className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
          </label>
          <div className="rounded-md border border-info/30 bg-info-soft p-3 text-xs text-info">
            Requesting <span className="tabular font-semibold">{days} day{days > 1 ? "s" : ""}</span>.
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent">Cancel</button>
          <button type="submit" disabled={submitting} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}
