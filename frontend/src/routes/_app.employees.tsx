import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid, List, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import { compactCurrency } from "@/lib/mock-data";
import api from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/employees")({
  component: EmployeesPage,
  head: () => ({
    meta: [
      { title: "Employees · TirthInfotech" },
      { name: "description", content: "Directory of all TirthInfotech employees across departments and locations." },
    ],
  }),
});
interface Employee {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;

    department: number;
    department_name: string;

    designation: number;
    designation_name: string;

    joining_date: string;

    annual_ctc: number;

    status: string;

    city: string;
    state: string;
    country: string;

    profile_photo: string | null;
}
function EmployeesPage() {
  const [view, setView] = useState<"list" | "grid">("list");
  const [dept, setDept] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchEmployees = async () => {
        try {
            const response = await api.get("/employees/");
            setEmployees(response.data);
        } catch (error) {
            console.error("Failed to load employees:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchEmployees();
}, []);
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (dept !== "All" && e.department_name !== dept) return false;
      if (status !== "All" && e.status !== status) return false;
      if (
          query &&
          !`${e.first_name} ${e.last_name} ${e.email} ${e.employee_code} ${e.designation_name}`
              .toLowerCase()
              .includes(query.toLowerCase())
      )
    
        return false;
      return true;
    });
  }, [employees, dept, query, status]);

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${employees.length} employees in the organization`}
        breadcrumbs={[{ label: "Home" }, { label: "People" }, { label: "Employees" }]}
        actions={
          <>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-accent">
              <Upload className="h-4 w-4" /> Import CSV
            </button>
            <Link
              to="/employee-add"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, code, email…"
              className="h-9 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary"
          >
            <option>All</option>
            {Array.from(
                new Set(employees.map((e) => e.department_name))
            ).map((department) => (
                <option key={department} value={department}>
                    {department}
                </option>
            ))}
          </select>
          <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-primary"
          >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="RESIGNED">Resigned</option>
          </select>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground hover:bg-accent">
            <Filter className="h-4 w-4" /> More filters
          </button>
          <div className="ml-auto flex rounded-md border border-border p-0.5">
            <button onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded", view === "list" ? "bg-accent text-foreground" : "text-muted-foreground")} aria-label="List view">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("grid")} className={cn("grid h-8 w-8 place-items-center rounded", view === "grid" ? "bg-accent text-foreground" : "text-muted-foreground")} aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === "list" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-resting)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">CTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((e) => (
                    <tr key={e.id} className="group hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <Link to="/employees/$id" params={{ id: String(e.id) }} className="flex items-center gap-3">
                          <Avatar
                              name={`${e.first_name} ${e.last_name}`}
                              color="blue"
                              size="sm"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground group-hover:text-primary">{e.first_name} {e.last_name}</div>
                            <div className="truncate text-xs text-muted-foreground">{e.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 tabular text-muted-foreground">{e.employee_code}</td>
                      <td className="px-4 py-3 text-foreground">{e.designation_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.department_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.city}, {e.state}</td>
                      <td className="px-4 py-3 tabular text-muted-foreground">{e.joining_date}</td>
                      <td className="px-4 py-3">
                        <StatusChip
                            tone={
                                e.status === "ACTIVE"
                                    ? "success"
                                    : e.status === "INACTIVE"
                                    ? "warning"
                                    : "danger"
                            }
                        >
                            {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                        </StatusChip>
                      </td>
                      <td className="px-4 py-3 text-right tabular font-medium text-foreground">{compactCurrency(e.annual_ctc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>Showing {filtered.length} of {employees.length}</span>
              <div className="flex items-center gap-1">
                <button className="rounded border border-border px-2 py-1 hover:bg-accent">Previous</button>
                <button className="rounded border border-border bg-accent px-2 py-1 font-medium text-foreground">1</button>
                <button className="rounded border border-border px-2 py-1 hover:bg-accent">2</button>
                <button className="rounded border border-border px-2 py-1 hover:bg-accent">Next</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((e) => (
              <Link
                key={e.id}
                to="/employees/$id"
                params={{ id: String(e.id) }}
                className="group rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] transition hover:shadow-[var(--shadow-hover)]"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                      name={`${e.first_name} ${e.last_name}`}
                      color="blue"
                      size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground group-hover:text-primary">
                        {e.first_name} {e.last_name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{e.designation_name}</div>
                    <div className="mt-2">
                      <StatusChip tone={e.status === "active" ? "success" : e.status === "on_leave" ? "warning" : "danger"}>
                        {e.status === "active" ? "Active" : e.status === "on_leave" ? "On leave" : "Notice"}
                      </StatusChip><StatusChip
                        tone={
                            e.status === "ACTIVE"
                                ? "success"
                                : e.status === "INACTIVE"
                                ? "warning"
                                : "danger"
                        }
                    >
                        {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                    </StatusChip>
                    </div>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                  <div><dt className="text-muted-foreground">Dept</dt><dd className="font-medium text-foreground">{e.department_name}</dd></div>
                  <div><dt className="text-muted-foreground">Code</dt><dd className="tabular font-medium text-foreground">{e.employee_code}</dd></div>
                  <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium text-foreground">{e.city}, {e.state}</dd></div>
                  <div><dt className="text-muted-foreground">Joined</dt><dd className="tabular font-medium text-foreground">{e.joining_date}</dd></div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
