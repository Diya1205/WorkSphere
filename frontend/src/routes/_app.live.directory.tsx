import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Shield } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/live/directory")({
  component: DirectoryPage,
  head: () => ({ meta: [{ title: "Directory · Northwind IT" }] }),
});

const sb = supabase as any;

const roleTone: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary",
  manager: "bg-warning-soft text-warning",
  employee: "bg-info-soft text-info",
};

function DirectoryPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; profile: any | null }>({ open: false, profile: null });

  const { data, isLoading } = useQuery({
    enabled: !!me && me.role === "admin",
    queryKey: ["directory"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        sb.from("profiles").select("*").order("full_name"),
        sb.from("user_roles").select("user_id, role"),
      ]);
      const byUser = new Map<string, AppRole>();
      (roles ?? []).forEach((r: any) => {
        const cur = byUser.get(r.user_id);
        const rank = (x: AppRole) => (x === "admin" ? 1 : x === "manager" ? 2 : 3);
        if (!cur || rank(r.role) < rank(cur)) byUser.set(r.user_id, r.role);
      });
      return { profiles: profiles ?? [], roleMap: byUser };
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await sb.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await sb.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["directory"] }); toast.success("Role updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["directory"] }); qc.invalidateQueries({ queryKey: ["profiles"] }); toast.success("Employee removed. Their tasks & meetings will be reassigned or cleared."); },
    onError: (e: any) => toast.error(e.message),
  });

  if (meLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!me || me.role !== "admin") return <Navigate to="/dashboard" />;

  return (
    <>
      <PageHeader
        title="Employee directory"
        description="Admin only — manage profiles and roles"
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Directory" }]}
        actions={
          <button onClick={() => setModal({ open: true, profile: null })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
            <Plus className="h-4 w-4" /> Invite / edit
          </button>
        }
      />
      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="mb-4 rounded-lg border border-info/30 bg-info-soft/40 p-3 text-xs text-info">
          <Shield className="mr-1.5 inline h-3.5 w-3.5" />
          New sign-ups create their profile automatically. Use this page to update titles/departments and reassign roles.
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-resting)]">
          {isLoading || !data ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : data.profiles.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No employees yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Job title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.profiles.map((p: any) => {
                  const role = data.roleMap.get(p.id) ?? "employee";
                  return (
                    <tr key={p.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={p.full_name} size="sm" />
                          <div><div className="font-medium">{p.full_name}</div><div className="text-xs text-muted-foreground">{p.email}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.job_title || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.department || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={role}
                          onChange={(e) => updateRole.mutate({ userId: p.id, role: e.target.value as AppRole })}
                          className={cn("rounded-full border-0 px-2 py-1 text-[11px] font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30", roleTone[role])}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="employee">Employee</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setModal({ open: true, profile: p })} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { if (p.id === me.id) return toast.error("You can't delete yourself"); if (confirm(`Remove ${p.full_name}?`)) del.mutate(p.id); }} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal.open && (
        <ProfileModal
          profile={modal.profile}
          managers={data?.profiles ?? []}
          onClose={() => setModal({ open: false, profile: null })}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["directory"] }); qc.invalidateQueries({ queryKey: ["profiles"] }); setModal({ open: false, profile: null }); }}
        />
      )}
    </>
  );
}

function ProfileModal({ profile, managers, onClose, onSaved }: any) {
  const isEdit = !!profile;
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [department, setDepartment] = useState(profile?.department ?? "");
  const [managerId, setManagerId] = useState<string>(profile?.manager_id ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit) { toast.info("New employees join by signing up. Use edit to update details."); return; }
    setSaving(true);
    try {
      const { error } = await sb.from("profiles").update({
        full_name: fullName, job_title: jobTitle || null, department: department || null, manager_id: managerId || null,
      }).eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{isEdit ? "Edit employee" : "Add employee"}</h2>
        {!isEdit && <p className="mt-1 text-xs text-muted-foreground">New employees sign up themselves at /auth — first user becomes admin, everyone else joins as employee. Use this form to edit their profile after they sign up.</p>}
        <div className="mt-4 space-y-3">
          <L label="Full name"><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" disabled={!isEdit} /></L>
          <L label="Job title"><input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="input" disabled={!isEdit} /></L>
          <L label="Department"><input value={department} onChange={(e) => setDepartment(e.target.value)} className="input" disabled={!isEdit} /></L>
          <L label="Reports to (manager)">
            <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="input" disabled={!isEdit}>
              <option value="">— None —</option>
              {managers.filter((m: any) => !profile || m.id !== profile.id).map((m: any) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </L>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-surface px-3 text-sm hover:bg-accent">Close</button>
          {isEdit && <button type="submit" disabled={saving} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>}
        </div>
        <style>{`.input{height:2.25rem;width:100%;border:1px solid hsl(var(--border));border-radius:.375rem;background:hsl(var(--background));padding:0 .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/.15)}.input:disabled{opacity:.6}`}</style>
      </form>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
