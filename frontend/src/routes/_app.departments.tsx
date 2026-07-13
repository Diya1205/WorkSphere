import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/hrms/PageHeader";
import { departments, compactCurrency } from "@/lib/mock-data";
import { Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/_app/departments")({
  component: DepartmentsPage,
  head: () => ({ meta: [{ title: "Departments · Northwind IT" }] }),
});

function DepartmentsPage() {
  return (
    <>
      <PageHeader
        title="Departments"
        description={`${departments.length} functions · ${departments.reduce((a, d) => a + d.headcount, 0)} people`}
        breadcrumbs={[{ label: "Home" }, { label: "People" }, { label: "Departments" }]}
      />
      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((d) => (
            <div key={d.name} className="group rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] transition hover:shadow-[var(--shadow-hover)]">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg" style={{ background: d.color + "22", color: d.color }}>
                  <div className="grid h-full w-full place-items-center font-bold" style={{ color: d.color }}>
                    {d.name[0]}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular">
                  {d.headcount} people
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold">{d.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Led by {d.head}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                <div>
                  <dt className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> Headcount</dt>
                  <dd className="mt-0.5 tabular font-semibold">{d.headcount}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-muted-foreground"><Wallet className="h-3 w-3" /> Budget FY26</dt>
                  <dd className="mt-0.5 tabular font-semibold">{compactCurrency(d.budget)}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
