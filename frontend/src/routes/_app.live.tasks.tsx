import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Info,
  Users,
  CalendarClock,
  FileText,
  MessageSquare,
  Flag,
  CalendarCheck2,
} from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { cn } from "@/lib/utils";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
} from "@/services/task";

import { getEmployees } from "@/services/employeeService";

export const Route = createFileRoute("/_app/live/tasks")({
  component: LiveTasksPage,
  head: () => ({ meta: [{ title: "Tasks · Northwind IT" }] }),
});

/* -------------------------------------------------------------------------- */
/*  Presentation config — display only, does not touch business logic         */
/* -------------------------------------------------------------------------- */

const STATUS_COLUMNS = [
  {
    id: "TODO",
    label: "To Do",
    dot: "bg-slate-400",
    chip: "bg-muted text-muted-foreground",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    dot: "bg-info",
    chip: "bg-info-soft text-info",
  },
  {
    id: "COMPLETED",
    label: "Completed",
    dot: "bg-success",
    chip: "bg-success-soft text-success",
  },
  {
    id: "CANCELLED",
    label: "Cancelled",
    dot: "bg-danger",
    chip: "bg-danger-soft text-danger",
  },
] as const;

const PRIORITY_CONFIG: Record<string, { label: string; badge: string }> = {
  LOW: { label: "Low", badge: "bg-muted text-muted-foreground border-border" },
  MEDIUM: { label: "Medium", badge: "bg-info-soft text-info border-info/20" },
  HIGH: { label: "High", badge: "bg-warning-soft text-warning border-warning/20" },
  URGENT: { label: "Urgent", badge: "bg-danger-soft text-danger border-danger/20" },
};

function statusMeta(status: string) {
  return STATUS_COLUMNS.find((c) => c.id === status) ?? STATUS_COLUMNS[0];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function LiveTasksPage() {
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState<any[]>([]);

  const [employees, setEmployees] = useState<any[]>([]);

  const [modal, setModal] = useState({
    open: false,
    task: null as any,
  });

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const taskData = await getTasks();

      const employeeData = await getEmployees();

      setTasks(taskData);

      setEmployees(employeeData);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) {
      return;
    }

    try {
      await deleteTask(id);

      await loadData();
    } catch (error) {
      console.error(error);

      alert("Failed to delete task.");
    }
  };

  const assigneeOptions = employees;

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {
      TODO: [],
      IN_PROGRESS: [],
      COMPLETED: [],
      CANCELLED: [],
    };
    for (const t of tasks || []) {
      if (grouped[t.status]) grouped[t.status].push(t);
      else grouped.TODO.push(t);
    }
    return grouped;
  }, [tasks]);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Manage employee tasks"
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Tasks" }]}
        actions={
          isAdmin ? (
            <button
              onClick={() => setModal({ open: true, task: null })}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          ) : null
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        {loading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-surface py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-24 text-center shadow-[var(--shadow-resting)]">
            <div className="text-sm text-muted-foreground">No tasks yet</div>
            {isAdmin && (
              <button
                onClick={() => setModal({ open: true, task: null })}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4" />
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] ?? [];
              return (
                <div
                  key={col.id}
                  className="flex min-h-[420px] flex-col rounded-xl border border-border bg-background/60 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                      <span className="text-sm font-semibold text-foreground">
                        {col.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular",
                          col.chip
                        )}
                      >
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex max-h-[calc(100vh-260px)] flex-col gap-2.5 overflow-y-auto pr-0.5">
                    {colTasks.map((t: any) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        employees={employees}
                        isAdmin={isAdmin}
                        onOpen={() => setModal({ open: true, task: t })}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="rounded-md border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                        Nothing here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal.open && (
        <TaskDetailsModal
          task={modal.task}
          assignees={assigneeOptions}
          isAdmin={isAdmin}
          onClose={() =>
            setModal({
              open: false,
              task: null,
            })
          }
          onSaved={async () => {
            await loadData();

            setModal({
              open: false,
              task: null,
            });
          }}
          onDelete={
            isAdmin
              ? async (id: number) => {
                  await handleDelete(id);
                  setModal({ open: false, task: null });
                }
              : undefined
          }
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task card                                                                 */
/* -------------------------------------------------------------------------- */

function TaskCard({
  task,
  employees,
  isAdmin,
  onOpen,
}: {
  task: any;
  employees: any[];
  isAdmin: boolean;
  onOpen: () => void;
}) {
  const assignee = employees.find((e: any) => e.id === task.assigned_to);
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.LOW;
  const status = statusMeta(task.status);

  const personName = isAdmin
    ? assignee
      ? `${assignee.first_name} ${assignee.last_name}`
      : "Unassigned"
    : task.assigned_by_name ?? "—";

  return (
    <div
      onClick={onOpen}
      className="group cursor-pointer rounded-lg border border-border bg-surface p-3.5 shadow-[var(--shadow-resting)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {task.task_code ?? `TASK-${task.id}`}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            priority.badge
          )}
        >
          {priority.label}
        </span>
      </div>

      <h4 className="mt-1.5 text-sm font-semibold leading-snug text-foreground">
        {task.title}
      </h4>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar name={personName} size="xs" />
          <span className="max-w-[110px] truncate text-[11px] font-medium text-foreground">
            {personName}
          </span>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            status.chip
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span>Assigned {formatDate(task.created_at)}</span>
        <span className="tabular">Due {formatDate(task.due_date)}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task details modal                                                        */
/*  Editing logic below mirrors the original TaskModal exactly:               */
/*  employees may only change status + employee_remarks, admins may change    */
/*  everything. No API/service/permission logic has been altered.             */
/* -------------------------------------------------------------------------- */

function TaskDetailsModal({
  task,
  assignees,
  isAdmin,
  onClose,
  onSaved,
  onDelete,
}: {
  task: any | null;
  assignees: any[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: (id: number) => void;
}) {
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(
    String(task?.assigned_to ?? assignees[0]?.id ?? "")
  );
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState(task?.status ?? "TODO");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? "");
  const [employeeRemarks, setEmployeeRemarks] = useState(
    task?.employee_remarks ?? ""
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      const data = {
        title,
        description,
        assigned_to: Number(assigneeId),
        priority: priority.toUpperCase(),
        status: status.toUpperCase(),
        start_date: startDate || null,
        due_date: dueDate,
        employee_remarks: employeeRemarks,
      };

      if (isEdit) {
        if (isAdmin) {
          await updateTask(task.id, data);
        } else {
          await updateTaskStatus(task.id, {
            status: status.toUpperCase(),
            employee_remarks: employeeRemarks,
            start_date: startDate || null,
          });
        }
      } else {
        if (!isAdmin) {
          alert("Only admins can create tasks.");
          return;
        }

        await createTask(data);
      }

      onSaved();
    } catch (error) {
      console.error(error);

      alert("Unable to save task.");
    } finally {
      setSaving(false);
    }
  };

  const assignedEmployee = assignees.find((a) => a.id === task?.assigned_to);
  const priorityInfo = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;
  const statusInfo = statusMeta(status);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-[modalIn_0.18s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {task?.task_code ?? (isEdit ? `TASK-${task.id}` : "New task")}
              </span>
              {isEdit && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    statusInfo.chip
                  )}
                >
                  {statusInfo.label}
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                  priorityInfo.badge
                )}
              >
                {priorityInfo.label}
              </span>
            </div>
            {isAdmin ? (
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="mt-1.5 w-full truncate border-none bg-transparent text-lg font-semibold text-foreground outline-none"
              />
            ) : (
              <h2 className="mt-1.5 truncate text-lg font-semibold text-foreground">
                {title}
              </h2>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isAdmin && isEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-accent"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* General Information */}
          <Section icon={Info} title="General Information">
            <div className="grid grid-cols-2 gap-4">
              {isAdmin && (
                <Field label="Priority">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </Field>
              )}
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Assignment Information */}
          <Section icon={Users} title="Assignment Information">
            <div className="grid grid-cols-2 gap-4">
              {isAdmin ? (
                <Field label="Assigned To">
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="input"
                  >
                    {assignees.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <ReadOnlyRow
                  label="Assigned To"
                  value={
                    assignedEmployee
                      ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}`
                      : "—"
                  }
                  avatarName={
                    assignedEmployee
                      ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}`
                      : undefined
                  }
                />
              )}
              <ReadOnlyRow
                label="Assigned By"
                value={task?.assigned_by_name ?? "—"}
                avatarName={task?.assigned_by_name}
              />
            </div>
          </Section>

          {/* Timeline */}
          <Section icon={CalendarClock} title="Timeline">
            <div className="grid grid-cols-2 gap-4">
              <ReadOnlyRow label="Assigned Date" value={formatDate(task?.created_at)} />
              <Field label="Start Date">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!isAdmin}
                  className="input"
                />
              </Field>
              <Field label="Due Date">
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!isAdmin}
                  className="input"
                />
              </Field>
              {task?.completed_at && (
                <ReadOnlyRow
                  label="Completed Date"
                  value={formatDate(task?.completed_at)}
                  icon={CalendarCheck2}
                />
              )}
            </div>
          </Section>

          {/* Description */}
          <Section icon={FileText} title="Description">
            {isAdmin ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add a description…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            ) : (
              <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {description || "No description provided."}
              </p>
            )}
          </Section>

          {/* Employee Remarks */}
          <Section icon={MessageSquare} title="Employee Remarks">
            {isAdmin ? (
              <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {employeeRemarks || "No remarks yet."}
              </p>
            ) : (
              <textarea
                value={employeeRemarks}
                onChange={(e) => setEmployeeRemarks(e.target.value)}
                rows={4}
                placeholder="Add a work update or completion remarks…"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            )}
          </Section>

          {isEdit && (task?.created_at || task?.updated_at) && (
            <div className="flex items-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
              {task?.created_at && <span>Created {formatDate(task.created_at)}</span>}
              {task?.updated_at && <span>Updated {formatDate(task.updated_at)}</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border bg-surface px-3 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <style>{`
        .input{height:2.25rem;width:100%;border:1px solid hsl(var(--border));border-radius:.375rem;background:hsl(var(--background));padding:0 .75rem;font-size:.875rem;outline:none}
        .input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/.15)}
        .input:disabled{background:hsl(var(--muted));color:hsl(var(--muted-foreground));cursor:not-allowed}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes modalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyRow({
  label,
  value,
  avatarName,
  icon: Icon,
}: {
  label: string;
  value: string;
  avatarName?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-foreground">
        {avatarName && <Avatar name={avatarName} size="xs" />}
        {Icon && !avatarName && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}