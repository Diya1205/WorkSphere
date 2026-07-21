import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Pencil, Plus, RotateCcw, Search, Trash2, Users, X } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import {
  departmentService,
  type Department,
  type DepartmentPayload,
} from "@/services/departmentservice";

export const Route = createFileRoute("/_app/departments")({
  component: DepartmentsPage,
  head: () => ({
    meta: [
      { title: "Departments · TirthInfotech" },
      { name: "description", content: "Manage company departments and headcount." },
    ],
  }),
});

function DepartmentsPage() {
  const { data: me } = useCurrentUser();
  const isAdmin = me?.role === "ADMIN";
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentService.getDepartments,
  });

  const createMut = useMutation({
    mutationFn: (payload: DepartmentPayload) => departmentService.createDepartment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to create department"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DepartmentPayload }) =>
      departmentService.updateDepartment(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Failed to update department"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => departmentService.deleteDepartment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
      setDeleteTarget(null);
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.detail ?? "Failed to delete this department");
      setDeleteTarget(null);
    },
  });

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, search]);

  const totalEmployees = departments.reduce((sum, d) => sum + (d.employee_count ?? 0), 0);

  const openAdd = () => {
    setEditingDepartment(null);
    setFormOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditingDepartment(d);
    setFormOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Departments"
        description={
          isLoading ? "Loading departments…" : `${departments.length} functions · ${totalEmployees} people`
        }
        breadcrumbs={[{ label: "Home" }, { label: "People" }, { label: "Departments" }]}
        actions={
          isAdmin && (
            <button
              onClick={openAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="relative mb-5 w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {isLoading && <DepartmentsSkeleton />}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">Failed to load departments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Something went wrong while fetching data from the server.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {departments.length === 0 ? "No Departments Found" : "No departments match your search"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {departments.length === 0
                ? "Get started by adding your first department."
                : "Try a different search term."}
            </p>
            {isAdmin && departments.length === 0 && (
              <button
                onClick={openAdd}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                Add Department
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && filteredDepartments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDepartments.map((d) => (
              <div
                key={d.id}
                className="group rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] transition hover:shadow-[var(--shadow-hover)]"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg" style={{ background: "#6366f122", color: "#6366f1" }}>
                    <div className="grid h-full w-full place-items-center font-bold">
                      {d.name[0]?.toUpperCase()}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      d.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {d.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold">{d.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {d.description || "No description added yet."}
                </p>

                <dl className="mt-4 border-t border-border pt-4 text-xs">
                  <div>
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" /> Employees
                    </dt>
                    <dd className="mt-0.5 tabular font-semibold">{d.employee_count}</dd>
                  </div>
                </dl>

                {isAdmin && (
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    <button
                      onClick={() => openEdit(d)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(d)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-danger hover:bg-danger-soft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && isAdmin && (
        <DepartmentFormDialog
          department={editingDepartment}
          submitting={createMut.isPending || updateMut.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={(values) => {
            if (editingDepartment) {
              updateMut.mutate({ id: editingDepartment.id, payload: values });
            } else {
              createMut.mutate(values);
            }
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-elevated)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Delete "{deleteTarget.name}"?</h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Departments with employees assigned to them cannot be
              deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                disabled={deleteMut.isPending}
                className="h-9 rounded-md bg-danger px-4 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-60"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DepartmentFormDialog({
  department,
  submitting,
  onClose,
  onSubmit,
}: {
  department: Department | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentPayload) => void;
}) {
  const isEditing = Boolean(department);
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Department name is required.");
      return;
    }
    onSubmit({ name: trimmed, description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-elevated)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{isEditing ? "Edit Department" : "Add Department"}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Department Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Information Technology"
              autoFocus
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={3}
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Add Department"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DepartmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)]">
          <div className="flex items-start justify-between">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-4 border-t border-border pt-4">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-1 h-4 w-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}