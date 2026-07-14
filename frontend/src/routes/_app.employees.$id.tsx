import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Mail, Phone, MapPin, CalendarDays, Briefcase, Building2, Download, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import { findEmployee, currency, compactCurrency } from "@/lib/mock-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/employees/$id")({
  loader: ({ params }) => {
    const emp = findEmployee(params.id);
    if (!emp) throw notFound();
    return emp;
  },
  component: EmployeeDetail,
  notFoundComponent: () => (
    <div className="p-12 text-center text-sm text-muted-foreground">Employee not found.</div>
  ),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.name} · TirthInfotech` }] : [],
  }),
});

const tabs = ["Overview", "Documents", "Skills", "Experience", "Salary", "Bank", "Timeline"] as const;

function EmployeeDetail() {
  const emp = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  const salaryBreakdown = [
    { label: "Basic", value: Math.round(emp.ctc * 0.4) },
    { label: "HRA", value: Math.round(emp.ctc * 0.2) },
    { label: "Special allowance", value: Math.round(emp.ctc * 0.18) },
    { label: "LTA", value: Math.round(emp.ctc * 0.05) },
    { label: "Employer PF", value: Math.round(emp.ctc * 0.05) },
    { label: "Bonus (variable)", value: Math.round(emp.ctc * 0.12) },
  ];

  return (
    <>
      <PageHeader
        title={emp.name}
        description={`${emp.designation} · ${emp.department} · ${emp.code}`}
        breadcrumbs={[
          { label: "Home" },
          { label: "Employees" },
          { label: emp.name },
        ]}
        actions={
          <>
            <Link to="/employees" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-accent">
              <ArrowLeft className="h-4 w-4" /> Directory
            </Link>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-accent">
              <Download className="h-4 w-4" /> ID card
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-accent" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </>
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Profile card */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <div className="flex justify-center">
                <Avatar name={emp.name} color={emp.avatarColor} size="lg" className="h-20 w-20 text-xl" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{emp.name}</h2>
              <div className="text-sm text-muted-foreground">{emp.designation}</div>
              <div className="mt-3 flex justify-center">
                <StatusChip tone={emp.status === "active" ? "success" : emp.status === "on_leave" ? "warning" : "danger"}>
                  {emp.status === "active" ? "Active" : emp.status === "on_leave" ? "On leave" : "Notice period"}
                </StatusChip>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 text-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-muted-foreground" /><span className="truncate">{emp.email}</span></li>
                <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-muted-foreground" /><span className="tabular">{emp.phone}</span></li>
                <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-muted-foreground" />{emp.location}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5 text-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment</h3>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2.5"><Briefcase className="h-4 w-4 text-muted-foreground" />{emp.employmentType}</li>
                <li className="flex items-center gap-2.5"><Building2 className="h-4 w-4 text-muted-foreground" />{emp.department}</li>
                <li className="flex items-center gap-2.5"><CalendarDays className="h-4 w-4 text-muted-foreground" /><span className="tabular">Joined {emp.joinDate}</span></li>
                {emp.manager && (
                  <li className="flex items-center gap-2.5"><span className="text-muted-foreground">Manager:</span><span className="font-medium">{emp.manager}</span></li>
                )}
              </ul>
            </div>
          </aside>

          {/* Tabs */}
          <div className="min-w-0">
            <div className="mb-4 border-b border-border">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "relative px-4 py-2.5 text-sm font-medium transition-colors",
                      tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t}
                    {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {tab === "Overview" && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-foreground">Personal information</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Employee code</dt><dd className="tabular font-medium">{emp.code}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Date of birth</dt><dd className="tabular font-medium">14 Aug 1993</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Blood group</dt><dd className="font-medium">O+</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Nationality</dt><dd className="font-medium">Indian</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Marital status</dt><dd className="font-medium">Single</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Address</dt><dd className="font-medium">{emp.location}, India</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold text-foreground">Emergency contact</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Name</dt><dd className="font-medium">Ravi {emp.name.split(" ").slice(-1)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Relation</dt><dd className="font-medium">Father</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="tabular font-medium">+91 98220 44112</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Alt. phone</dt><dd className="tabular font-medium">+91 80230 11207</dd></div>
                  </dl>
                </div>
                <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Compensation summary</h3>
                    <span className="text-xs text-muted-foreground">Effective Apr 2026</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-3xl font-semibold tracking-tight tabular">{compactCurrency(emp.ctc)}</div>
                    <div className="text-xs text-muted-foreground">annual CTC · {currency(Math.round(emp.ctc / 12))} monthly gross</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {salaryBreakdown.map((s) => {
                      const pct = (s.value / emp.ctc) * 100;
                      return (
                        <div key={s.label}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{s.label}</span>
                            <span className="tabular font-medium">{currency(s.value)} <span className="text-muted-foreground">· {pct.toFixed(0)}%</span></span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === "Timeline" && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Career timeline</h3>
                <ol className="space-y-4">
                  {[
                    { date: "2026-04-01", title: "Promoted to " + emp.designation, meta: "Compensation revised to " + compactCurrency(emp.ctc) },
                    { date: "2024-04-01", title: "Merit increase", meta: "+12% base + 8% variable" },
                    { date: "2022-10-15", title: "Team change", meta: "Moved to " + emp.department },
                    { date: emp.joinDate, title: "Joined TirthInfotech", meta: "Hired as " + emp.designation.replace("Senior ", "").replace("Staff ", "") },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary-soft" />
                        {i < 3 && <div className="mt-1 flex-1 w-px bg-border" />}
                      </div>
                      <div className="pb-4">
                        <div className="text-xs tabular text-muted-foreground">{item.date}</div>
                        <div className="mt-0.5 text-sm font-medium text-foreground">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.meta}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {tab !== "Overview" && tab !== "Timeline" && (
              <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
                {tab} content lives here in the full platform.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
