import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { StatusChip } from "@/components/hrms/StatusChip";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { currency, compactCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/payroll")({
  component: PayrollPage,
  head: () => ({ meta: [{ title: "Payroll · TirthInfotech" }] }),
});

const sb = supabase as any;

type Row = {
  id: string; user_id: string; period: string; basic: number; allowances: number;
  deductions: number; net_pay: number; status: "draft" | "review" | "ready" | "paid";
};

function PayrollPage() {
  const { data: me } = useCurrentUser();
  const isEmployee = me?.role === "employee";

  const { data: rows = [], isLoading } = useQuery({
    enabled: !!me,
    queryKey: ["salary", me?.id, me?.role],
    queryFn: async (): Promise<Row[]> => {
      let q = sb.from("salary").select("*").order("period", { ascending: false });
      if (isEmployee) q = q.eq("user_id", me!.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        basic: Number(r.basic), allowances: Number(r.allowances),
        deductions: Number(r.deductions), net_pay: Number(r.net_pay),
      }));
    },
  });

  const { data: profiles = [] } = useQuery({
    enabled: !!me && !isEmployee,
    queryKey: ["profiles-pay"],
    queryFn: async () => (await sb.from("profiles").select("id, full_name, department, avatar_color")).data ?? [],
  });

  const totals = useMemo(() => {
    const gross = rows.reduce((s, r) => s + r.basic + r.allowances, 0);
    const ded = rows.reduce((s, r) => s + r.deductions, 0);
    const net = rows.reduce((s, r) => s + r.net_pay, 0);
    return { gross, ded, net, count: rows.length };
  }, [rows]);

  return (
    <>
      <PageHeader
        title={isEmployee ? "Payslips" : "Payroll"}
        description={isEmployee ? "Your salary breakdown and payslip history" : `${rows.length} payslip records`}
        breadcrumbs={[{ label: "Home" }, { label: "Finance" }, { label: "Payroll" }]}
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-accent">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">
        {!isEmployee && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card label="Gross payroll" value={compactCurrency(totals.gross)} />
            <Card label="Deductions" value={compactCurrency(totals.ded)} />
            <Card label="Net disbursement" value={compactCurrency(totals.net)} />
            <Card label="Records" value={String(totals.count)} />
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">{isEmployee ? "Your payslips" : "Payslip run"}</h3>
              <p className="text-xs text-muted-foreground">
                {isEmployee ? "Only your own records are shown" : `${rows.length} records`}
              </p>
            </div>
            {!isEmployee && <StatusChip tone="neutral">Live data</StatusChip>}
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : rows.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No payslip records yet{isEmployee ? "" : " — admins can add salary records"}.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {!isEmployee && <th className="px-4 py-3">Employee</th>}
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Basic</th>
                    <th className="px-4 py-3 text-right">Allowances</th>
                    <th className="px-4 py-3 text-right">Deductions</th>
                    <th className="px-4 py-3 text-right">Net pay</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => {
                    const p = profiles.find((x: any) => x.id === r.user_id);
                    return (
                      <tr key={r.id} className="hover:bg-accent/40">
                        {!isEmployee && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={p?.full_name ?? "User"} color={p?.avatar_color} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate font-medium">{p?.full_name ?? "User"}</div>
                                <div className="truncate text-xs text-muted-foreground">{p?.department ?? ""}</div>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 tabular text-muted-foreground">{r.period.slice(0, 7)}</td>
                        <td className="px-4 py-3 text-right tabular">{currency(Math.round(r.basic))}</td>
                        <td className="px-4 py-3 text-right tabular">{currency(Math.round(r.allowances))}</td>
                        <td className="px-4 py-3 text-right tabular text-danger">-{currency(Math.round(r.deductions))}</td>
                        <td className="px-4 py-3 text-right tabular font-semibold">{currency(Math.round(r.net_pay))}</td>
                        <td className="px-4 py-3">
                          <StatusChip tone={r.status === "paid" ? "success" : r.status === "ready" ? "info" : r.status === "review" ? "warning" : "neutral"}>
                            {r.status}
                          </StatusChip>
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
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular">{value}</div>
    </div>
  );
}
