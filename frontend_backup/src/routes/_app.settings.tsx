import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/hrms/PageHeader";
import { StatusChip } from "@/components/hrms/StatusChip";
import { Shield, Bell, Building, Palette, Globe, Key, Save } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · TirthInfotech" }] }),
});

const sections = [
  { icon: Building, label: "Company profile", desc: "Legal name, addresses, branding" },
  { icon: Shield, label: "Roles & permissions", desc: "6 roles configured · 42 granular permissions" },
  { icon: Bell, label: "Notifications", desc: "Email, in-app and Slack templates" },
  { icon: Key, label: "Security & sessions", desc: "SSO · 2FA · password policy" },
  { icon: Palette, label: "Theme & branding", desc: "Colors, logos, email templates" },
  { icon: Globe, label: "Language & locale", desc: "6 languages · 4 currencies" },
];

function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure the platform for your organization"
        breadcrumbs={[{ label: "Home" }, { label: "Admin" }, { label: "Settings" }]}
        actions={
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
            <Save className="h-4 w-4" /> Save changes
          </button>
        }
      />
      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => (
            <div key={s.label} className="group rounded-xl border border-border bg-surface p-5 transition hover:border-primary/40 hover:shadow-[var(--shadow-hover)]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{s.label}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
              <div className="mt-3">
                <StatusChip tone="success">Configured</StatusChip>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold">Role permissions matrix</h3>
          <p className="text-xs text-muted-foreground">Preview · view full editor in Roles & permissions</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="py-2">Module</th>
                  <th className="py-2 text-center">Super Admin</th>
                  <th className="py-2 text-center">HR</th>
                  <th className="py-2 text-center">Manager</th>
                  <th className="py-2 text-center">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["Payroll", "Full", "Process", "View team", "Self only"],
                  ["Leave", "Override", "Approve", "Approve team", "Apply"],
                  ["Employee records", "Full CRUD", "CRUD org", "View team", "View self"],
                  ["Recruitment", "Full", "Full", "Interview", "—"],
                  ["Settings", "Full", "Limited", "Personal", "Personal"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="py-2.5 font-medium">{row[0]}</td>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className="py-2.5 text-center text-xs">
                        <span className={cell === "—" ? "text-muted-foreground/60" : "text-foreground"}>{cell}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
