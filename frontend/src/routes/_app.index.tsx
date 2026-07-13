import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import {
  Users, UserCheck, CalendarOff, BriefcaseBusiness, Wallet, TrendingDown,
  ArrowRight, Check, X, Cake, PartyPopper, CalendarDays, Megaphone, Sparkles,
  ChevronRight, Plus,
} from "lucide-react";
import { KpiCard } from "@/components/hrms/KpiCard";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import {
  activityFeed, announcements, attendance30Days, compactCurrency, departments,
  findEmployee, growthYoY, kpiTrends, leaveRequests, taskCompletion, upcomingEvents,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard · Northwind IT" },
      { name: "description", content: "HR operations at a glance — headcount, attendance, payroll, approvals and org health." },
    ],
  }),
});

const chartColors = {
  primary: "oklch(0.546 0.207 262)",
  success: "oklch(0.62 0.16 149)",
  warning: "oklch(0.68 0.16 55)",
  danger: "oklch(0.577 0.225 27)",
  muted: "oklch(0.918 0.013 255)",
};

function TooltipCard({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-hover)]">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 tabular">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  const pending = leaveRequests.filter((l) => l.status === "pending");

  return (
    <>
      <PageHeader
        title="Good morning, Ananya"
        description="Here's what's happening across Northwind today · Friday, 3 July 2026"
        breadcrumbs={[{ label: "Home" }, { label: "Dashboard" }]}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
              <CalendarDays className="h-4 w-4" /> Last 30 days
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark">
              <Plus className="h-4 w-4" /> New request
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total employees" value={kpiTrends.totalEmployees.value.toLocaleString()} delta={kpiTrends.totalEmployees.delta} helper="vs. last month" icon={Users} series={kpiTrends.totalEmployees.series} />
          <KpiCard label="Present today" value={kpiTrends.presentToday.value.toLocaleString()} delta={kpiTrends.presentToday.delta} helper="80.5% of workforce" icon={UserCheck} series={kpiTrends.presentToday.series} />
          <KpiCard label="On leave" value={kpiTrends.onLeave.value.toString()} delta={kpiTrends.onLeave.delta} helper="vs. last week" icon={CalendarOff} series={kpiTrends.onLeave.series} />
          <KpiCard label="Open positions" value={kpiTrends.openPositions.value.toString()} delta={kpiTrends.openPositions.delta} helper="4 closed this month" icon={BriefcaseBusiness} series={kpiTrends.openPositions.series} />
          <KpiCard label="Monthly payroll" value={compactCurrency(kpiTrends.payrollCost.value)} delta={kpiTrends.payrollCost.delta} helper="June 2026 run" icon={Wallet} series={kpiTrends.payrollCost.series} />
          <KpiCard label="Attrition (TTM)" value={`${kpiTrends.attrition.value}%`} delta={kpiTrends.attrition.delta} helper="industry: 11.2%" icon={TrendingDown} series={kpiTrends.attrition.series} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Attendance trend */}
          <div className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Attendance trend</h3>
                <p className="text-xs text-muted-foreground">Last 30 days · daily headcount</p>
              </div>
              <div className="flex gap-1 rounded-md border border-border p-0.5 text-xs">
                <button className="rounded bg-accent px-2 py-1 font-medium text-foreground">30d</button>
                <button className="px-2 py-1 text-muted-foreground">90d</button>
                <button className="px-2 py-1 text-muted-foreground">YTD</button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendance30Days} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartColors.muted} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<TooltipCard />} />
                  <Area type="monotone" dataKey="present" name="Present" stroke={chartColors.primary} strokeWidth={2} fill="url(#present)" />
                  <Line type="monotone" dataKey="late" name="Late" stroke={chartColors.warning} strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="absent" name="Absent" stroke={chartColors.danger} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department distribution */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Department mix</h3>
              <p className="text-xs text-muted-foreground">Headcount by function</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={departments} dataKey="headcount" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
                      {departments.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="var(--surface)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipCard />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
                {departments.slice(0, 6).map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: d.color }} />
                    <span className="min-w-0 flex-1 truncate text-foreground">{d.name}</span>
                    <span className="tabular font-medium text-muted-foreground">{d.headcount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Task completion */}
          <div className="rounded-xl border border-border bg-surface p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Task velocity</h3>
                <p className="text-xs text-muted-foreground">Weekly across all projects</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskCompletion} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chartColors.muted} strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<TooltipCard />} cursor={{ fill: "oklch(0.968 0.007 247)" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="done" name="Done" stackId="a" fill={chartColors.success} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgress" name="In progress" stackId="a" fill={chartColors.primary} />
                  <Bar dataKey="blocked" name="Blocked" stackId="a" fill={chartColors.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Employee growth</h3>
              <p className="text-xs text-muted-foreground">Jan–Jul 2026</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthYoY} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chartColors.muted} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.52 0.03 257)" }} tickLine={false} axisLine={false} width={40} domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip content={<TooltipCard />} />
                  <Line type="monotone" dataKey="employees" name="Headcount" stroke={chartColors.primary} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lower row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pending approvals */}
          <div className="rounded-xl border border-border bg-surface lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Pending approvals</h3>
                <p className="text-xs text-muted-foreground">{pending.length} leave requests waiting on you</p>
              </div>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="divide-y divide-border">
              {pending.map((l) => {
                const emp = findEmployee(l.employeeId);
                if (!emp) return null;
                return (
                  <li key={l.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/40">
                    <Avatar name={emp.name} color={emp.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{emp.name}</span>
                        <StatusChip tone="warning" dot={false}>{l.type} leave</StatusChip>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {l.days} day{l.days > 1 ? "s" : ""} · {l.from} → {l.to} · {l.reason}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="grid h-8 w-8 place-items-center rounded-md border border-border text-danger hover:bg-danger-soft" aria-label="Reject">
                        <X className="h-4 w-4" />
                      </button>
                      <button className="grid h-8 w-8 place-items-center rounded-md bg-success text-success-foreground hover:bg-success/90" aria-label="Approve">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Announcements */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Announcements</h3>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark">
                <Megaphone className="h-3.5 w-3.5" /> Post
              </button>
            </div>
            <ul className="divide-y divide-border">
              {announcements.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusChip tone="primary" dot={false}>{a.tag}</StatusChip>
                    <span className="text-[11px] text-muted-foreground">{a.date}</span>
                  </div>
                  <div className="mt-1.5 text-sm font-medium text-foreground">{a.title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming events */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Upcoming this week</h3>
              <p className="text-xs text-muted-foreground">Birthdays, anniversaries and deadlines</p>
            </div>
            <ul className="divide-y divide-border">
              {upcomingEvents.map((e) => {
                const Icon = e.type === "birthday" ? Cake : e.type === "anniversary" ? PartyPopper : e.type === "meeting" ? CalendarDays : Sparkles;
                const tone = e.type === "birthday" ? "primary" : e.type === "anniversary" ? "success" : e.type === "meeting" ? "info" : "warning";
                return (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md bg-${tone}-soft text-${tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{e.name}</div>
                      <div className="text-[11px] text-muted-foreground">{e.date}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Activity feed */}
          <div className="rounded-xl border border-border bg-surface lg:col-span-2">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Activity</h3>
              <p className="text-xs text-muted-foreground">System and team events</p>
            </div>
            <ol className="divide-y divide-border">
              {activityFeed.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={a.who} size="xs" />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium text-foreground">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="text-foreground">{a.target}</span>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{a.when}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
