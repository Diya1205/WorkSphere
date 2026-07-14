import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/hrms/PageHeader";
import { useCurrentUser } from "@/hooks/use-current-user";
import api from "@/services/api";
import { Users, CheckSquare, ListTodo, Building2, UserCheck, UserX, Loader2 } from "lucide-react";
import { Avatar } from "@/components/hrms/Avatar";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard · TirthInfotech" }] }),
});

type AdminDashboard = {
  role: "ADMIN";
  stats: {
    total_employees: number;
    active_employees: number;
    departments: number;
    present_today: number;
    absent_today: number;
    pending_tasks: number;
    completed_tasks: number;
  };
  department_headcount: { department__name: string | null; count: number }[];
  tasks_by_assignee: {
    assigned_to__id: number;
    assigned_to__first_name: string;
    assigned_to__last_name: string;
    pending: number;
    in_progress: number;
    completed: number;
  }[];
  recent_employees: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    department__name: string | null;
    created_at: string;
  }[];
  recent_tasks: {
    id: number;
    task_code: string;
    title: string;
    status: string;
    priority: string;
    assigned_to__first_name: string;
    assigned_to__last_name: string;
    due_date: string;
  }[];
};

type EmployeeDashboard = {
  role: "EMPLOYEE";
  stats: {
    my_tasks: number;
    pending_tasks: number;
    completed_tasks: number;
    attendance_status: string | null;
    check_in: string | null;
    check_out: string | null;
  };
  recent_tasks: {
    id: number;
    task_code: string;
    title: string;
    status: string;
    priority: string;
    due_date: string;
  }[];
};

type DashboardData = AdminDashboard | EmployeeDashboard;

function Stat({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: any;
  tone?: "primary" | "success" | "warning" | "info";
}) {
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
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
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
      const res = await api.get<DashboardData>("/dashboard/");
      return res.data;
    },
  });

  if (meLoading || isLoading || !me || !data) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${(me.fullName ?? "").split(" ")[0]}`}
        description={data.role === "ADMIN" ? "Organization overview" : "Your day"}
        breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}
      />
      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">
        {data.role === "ADMIN" ? <AdminView data={data} /> : <EmployeeView data={data} />}
      </div>
    </>
  );
}

function AdminView({ data }: { data: AdminDashboard }) {
  const { stats } = data;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total employees" value={stats.total_employees} icon={Users} />
        <Stat label="Active employees" value={stats.active_employees} icon={UserCheck} tone="success" />
        <Stat label="Departments" value={stats.departments} icon={Building2} tone="info" />
        <Stat label="Pending tasks" value={stats.pending_tasks} icon={ListTodo} tone="warning" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Present today" value={stats.present_today} icon={UserCheck} tone="success" />
        <Stat label="Absent today" value={stats.absent_today} icon={UserX} tone="warning" />
        <Stat label="Completed tasks" value={stats.completed_tasks} icon={CheckSquare} tone="success" />
        <Stat label="Total tasks" value={stats.pending_tasks + stats.completed_tasks} icon={ListTodo} />
      </div>
      <TaskStatusByAssignee rows={data.tasks_by_assignee} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HeadcountByDept rows={data.department_headcount} />
        <RecentEmployees rows={data.recent_employees} />
      </div>
      <RecentTasks rows={data.recent_tasks} showAssignee />
    </>
  );
}

function EmployeeView({ data }: { data: EmployeeDashboard }) {
  const { stats } = data;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="My tasks" value={stats.my_tasks} icon={ListTodo} />
        <Stat label="Pending" value={stats.pending_tasks} icon={ListTodo} tone="warning" />
        <Stat label="Completed" value={stats.completed_tasks} icon={CheckSquare} tone="success" />
        <Stat
          label="Today's status"
          value={stats.attendance_status === "PRESENT" ? "Present" : stats.attendance_status === "ABSENT" ? "Absent" : "--"}
          icon={UserCheck}
          tone={stats.attendance_status === "PRESENT" ? "success" : "warning"}
        />
      </div>
      <RecentTasks rows={data.recent_tasks} />
    </>
  );
}

function TaskStatusByAssignee({ rows }: { rows: AdminDashboard["tasks_by_assignee"] }) {
  const shaped = rows.map((r) => ({
    name: `${r.assigned_to__first_name} ${r.assigned_to__last_name}`,
    pending: r.pending,
    in_progress: r.in_progress,
    completed: r.completed,
    total: r.pending + r.in_progress + r.completed,
  }));
  const max = Math.max(1, ...shaped.map((r) => r.total));

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Task status by assignee</div>
      {shaped.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        <div className="space-y-3">
          {shaped.map((r) => (
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

function HeadcountByDept({ rows }: { rows: AdminDashboard["department_headcount"] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;
  const palette = ["bg-primary", "bg-success", "bg-warning", "bg-info", "bg-danger", "bg-purple-500"];
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Headcount by department</div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No employees yet</div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={r.department__name ?? "unassigned"}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{r.department__name ?? "Unassigned"}</span>
                <span className="tabular text-muted-foreground">
                  {r.count} · {Math.round((r.count / total) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded bg-muted">
                <div className={`${palette[i % palette.length]} h-full`} style={{ width: `${(r.count / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentEmployees({ rows }: { rows: AdminDashboard["recent_employees"] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Recent employees</div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No employees yet</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={`${r.first_name} ${r.last_name}`} size="xs" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-muted-foreground">{r.department__name ?? "Unassigned"} · {r.employee_code}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RecentTasks({ rows, showAssignee }: { rows: any[]; showAssignee?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
      <div className="mb-4 text-sm font-semibold">Recent tasks</div>
      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No tasks yet</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.task_code} · Due {r.due_date}
                  {showAssignee && r.assigned_to__first_name ? ` · ${r.assigned_to__first_name} ${r.assigned_to__last_name}` : ""}
                </div>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                {r.status.replace("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}