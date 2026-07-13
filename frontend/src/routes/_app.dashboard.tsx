import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/hrms/PageHeader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckSquare, ListTodo, Video, Loader2 } from "lucide-react";
import { Avatar } from "@/components/hrms/Avatar";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard · Northwind IT" }] }),
});

const sb = supabase as any;

function Stat({ label, value, icon: Icon, tone = "primary" }: { label: string; value: number | string; icon: any; tone?: "primary" | "success" | "warning" | "info" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular tracking-tight">{value}</div>
    </div>
  );
}

function DashboardPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();

  const { data, isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["dashboard", me?.id, me?.role],
    queryFn: async () => {
      const [{ data: profiles }, { data: tasks }, { data: meetings }, { data: mp }] = await Promise.all([
        sb.from("profiles").select("id, full_name, department, manager_id, avatar_color"),
        sb.from("tasks").select("*"),
        sb.from("meetings").select("*").order("meeting_date", { ascending: true }).limit(50),
        sb.from("meeting_participants").select("meeting_id, user_id"),
      ]);
      return {
        profiles: profiles ?? [],
        tasks: tasks ?? [],
        meetings: meetings ?? [],
        mp: mp ?? [],
      };
    },
  });

  const scoped = useMemo(() => {
    if (!me || !data) return null;
    const teamIds = new Set(data.profiles.filter((p: any) => p.manager_id === me.id).map((p: any) => p.id));
    teamIds.add(me.id);
    let tasks = data.tasks;
    if (me.role === "manager") tasks = tasks.filter((t: any) => teamIds.has(t.assignee_id) || t.created_by === me.id);
    if (me.role === "employee") tasks = tasks.filter((t: any) => t.assignee_id === me.id || t.created_by === me.id);

    const myMeetingIds = new Set(data.mp.filter((r: any) => r.user_id === me.id).map((r: any) => r.meeting_id));
    let meetings = data.meetings;
    if (me.role === "employee") meetings = meetings.filter((m: any) => myMeetingIds.has(m.id) || m.created_by === me.id);
    if (me.role === "manager") {
      const teamMeetingIds = new Set(data.mp.filter((r: any) => teamIds.has(r.user_id)).map((r: any) => r.meeting_id));
      meetings = meetings.filter((m: any) => teamMeetingIds.has(m.id) || m.created_by === me.id);
    }
    return { tasks, meetings, teamIds };
  }, [me, data]);

  if (meLoading || isLoading || !me || !scoped) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…</div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const totalOpen = scoped.tasks.filter((t: any) => t.status !== "completed").length;
  const totalDone = scoped.tasks.filter((t: any) => t.status === "completed").length;
  const totalPending = scoped.tasks.filter((t: any) => t.status === "pending").length;
  const meetingsThisWeek = scoped.meetings.filter((m: any) => m.meeting_date >= today && m.meeting_date <= weekEnd).length;
  const meetingsToday = scoped.meetings.filter((m: any) => m.meeting_date === today).length;
  const upcoming = scoped.meetings.filter((m: any) => m.meeting_date >= today).slice(0, 4);

  return (
    <>
      <PageHeader
        title={`Welcome, ${me.fullName.split(" ")[0]}`}
        description={me.role === "admin" ? "Organization overview" : me.role === "manager" ? "Your team at a glance" : "Your day"}
        breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">
        {me.role === "admin" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total employees" value={data!.profiles.length} icon={Users} />
              <Stat label="Open tasks" value={totalOpen} icon={ListTodo} tone="warning" />
              <Stat label="Completed" value={totalDone} icon={CheckSquare} tone="success" />
              <Stat label="Meetings this week" value={meetingsThisWeek} icon={Video} tone="info" />
            </div>
            <TaskStatusByAssignee tasks={scoped.tasks} profiles={data!.profiles} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <HeadcountByDept profiles={data!.profiles} />
              <UpcomingMeetings meetings={upcoming} profiles={data!.profiles} mp={data!.mp} />
            </div>
          </>
        )}

        {me.role === "manager" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Team tasks open" value={totalOpen} icon={ListTodo} tone="warning" />
              <Stat label="Completed" value={totalDone} icon={CheckSquare} tone="success" />
              <Stat label="Meetings this week" value={meetingsThisWeek} icon={Video} tone="info" />
            </div>
            <TaskStatusByAssignee tasks={scoped.tasks} profiles={data!.profiles.filter((p: any) => scoped.teamIds.has(p.id))} />
            <UpcomingMeetings meetings={upcoming} profiles={data!.profiles} mp={data!.mp} />
          </>
        )}

        {me.role === "employee" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="My tasks" value={scoped.tasks.length} icon={ListTodo} />
              <Stat label="Completed" value={totalDone} icon={CheckSquare} tone="success" />
              <Stat label="Pending" value={totalPending} icon={ListTodo} tone="warning" />
              <Stat label="Meetings today" value={meetingsToday} icon={Video} tone="info" />
            </div>
            <PersonalTaskBars tasks={scoped.tasks} />
            <UpcomingMeetings meetings={upcoming} profiles={data!.profiles} mp={data!.mp} />
          </>
        )}
      </div>
    </>
  );
}

function TaskStatusByAssignee({ tasks, profiles }: { tasks: any[]; profiles: any[] }) {
  const byAssignee = new Map<string, { pending: number; in_progress: number; completed: number }>();
  tasks.forEach((t) => {
    if (!t.assignee_id) return;
    const cur = byAssignee.get(t.assignee_id) ?? { pending: 0, in_progress: 0, completed: 0 };
    cur[t.status as "pending" | "in_progress" | "completed"] = (cur[t.status as "pending" | "in_progress" | "completed"] ?? 0) + 1;
    byAssignee.set(t.assignee_id, cur);
  });
  const rows = [...byAssignee.entries()].map(([id, counts]) => {
    const p = profiles.find((x) => x.id === id);
    return { name: p?.full_name ?? "Unknown", ...counts, total: counts.pending + counts.in_progress + counts.completed };
  }).sort((a, b) => b.total - a.total).slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Task status by assignee</div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-xs">
              <div className="truncate font-medium">{r.name}</div>
              <div className="flex h-3 overflow-hidden rounded bg-muted">
                <div className="bg-muted-foreground/60" style={{ width: `${(r.pending / max) * 100}%` }} title={`Pending: ${r.pending}`} />
                <div className="bg-info" style={{ width: `${(r.in_progress / max) * 100}%` }} title={`In progress: ${r.in_progress}`} />
                <div className="bg-success" style={{ width: `${(r.completed / max) * 100}%` }} title={`Completed: ${r.completed}`} />
              </div>
              <div className="tabular text-right text-muted-foreground">{r.total}</div>
            </div>
          ))}
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted-foreground/60" /> Pending</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-info" /> In progress</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-success" /> Completed</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeadcountByDept({ profiles }: { profiles: any[] }) {
  const counts = new Map<string, number>();
  profiles.forEach((p) => {
    const d = p.department || "Unassigned";
    counts.set(d, (counts.get(d) ?? 0) + 1);
  });
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = profiles.length || 1;
  const palette = ["bg-primary", "bg-success", "bg-warning", "bg-info", "bg-danger", "bg-purple-500"];
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Headcount by department</div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No employees yet</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map(([dept, n], i) => (
            <div key={dept}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{dept}</span>
                <span className="tabular text-muted-foreground">{n} · {Math.round((n / total) * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-muted">
                <div className={`${palette[i % palette.length]} h-full`} style={{ width: `${(n / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingMeetings({ meetings, profiles, mp }: { meetings: any[]; profiles: any[]; mp: any[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Upcoming meetings</div>
      {meetings.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No meetings scheduled</div>
      ) : (
        <ul className="divide-y divide-border">
          {meetings.map((m) => {
            const parts = mp.filter((r) => r.meeting_id === m.id).map((r) => profiles.find((p) => p.id === r.user_id)).filter(Boolean);
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground tabular">{m.meeting_date} · {String(m.meeting_time).slice(0, 5)}</div>
                </div>
                <div className="flex -space-x-2">
                  {parts.slice(0, 4).map((p: any) => <Avatar key={p.id} name={p.full_name} size="xs" />)}
                  {parts.length > 4 && <div className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-surface">+{parts.length - 4}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PersonalTaskBars({ tasks }: { tasks: any[] }) {
  const pending = tasks.filter((t) => t.status === "pending").length;
  const inProg = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const total = Math.max(1, tasks.length);
  const rows = [
    { label: "Pending", n: pending, cls: "bg-muted-foreground/60" },
    { label: "In progress", n: inProg, cls: "bg-info" },
    { label: "Completed", n: done, cls: "bg-success" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">My task status</div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs"><span>{r.label}</span><span className="tabular text-muted-foreground">{r.n}</span></div>
            <div className="h-2 overflow-hidden rounded bg-muted"><div className={`${r.cls} h-full`} style={{ width: `${(r.n / total) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
