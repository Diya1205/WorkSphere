import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
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
  head: () => ({ meta: [{ title: "Tasks · TirthInfotech" }] }),
});

/* -------------------------------------------------------------------------- */
/*  Presentation config — display only, does not touch business logic         */
/* -------------------------------------------------------------------------- */

const STATUS_COLUMNS = [
  { id: "TODO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
] as const;

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function statusLabel(status: string) {
  return STATUS_COLUMNS.find((c) => c.id === status)?.label ?? status;
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
/*  Shared plain styles (diagnostic — no vars, no oklch, no blur, no transform)*/
/* -------------------------------------------------------------------------- */

const colors = {
  bg: "#ffffff",
  border: "#d1d5db",
  text: "#111827",
  subtext: "#6b7280",
  page: "#f3f4f6",
};

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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const t of tasks || []) {
      if (counts[t.status] !== undefined) counts[t.status] += 1;
    }
    return counts;
  }, [tasks]);

  return (
    <div style={{ background: colors.page, minHeight: "100%" }}>
      <PageHeader
        title="Tasks"
        description="Manage employee tasks"
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Tasks" }]}
        actions={
          isAdmin ? (
            <button
              onClick={() => setModal({ open: true, task: null })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "36px",
                padding: "0 12px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                borderRadius: "6px",
              }}
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          ) : null
        }
      />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Task Statistics */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {STATUS_COLUMNS.map((col) => (
            <div
              key={col.id}
              style={{
                flex: "1 1 140px",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 700, color: colors.text }}>
                {statusCounts[col.id]}
              </div>
              <div style={{ fontSize: "12px", color: colors.subtext, marginTop: "4px" }}>
                {col.label}
              </div>
            </div>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "60px 0",
              color: colors.subtext,
            }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "60px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: colors.subtext }}>No tasks yet</div>
            {isAdmin && (
              <button
                onClick={() => setModal({ open: true, task: null })}
                style={{
                  marginTop: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 12px",
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                <Plus className="h-4 w-4" />
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div>
            {tasks.map((t: any) => (
              <TaskRow
                key={t.id}
                task={t}
                employees={employees}
                isAdmin={isAdmin}
                onOpen={() => setModal({ open: true, task: t })}
              />
            ))}
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task row (plain, simple, vertical list item — replaces Kanban TaskCard)   */
/* -------------------------------------------------------------------------- */

function TaskRow({
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

  const personName = isAdmin
    ? assignee
      ? `${assignee.first_name} ${assignee.last_name}`
      : "Unassigned"
    : task.assigned_by_name ?? "—";

  return (
    <div
      onClick={onOpen}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: colors.subtext }}>
          {task.task_code ?? `TASK-${task.id}`}
        </span>
        <span style={{ fontSize: "11px", fontWeight: 600, color: colors.text }}>
          {PRIORITY_LABEL[task.priority] ?? task.priority}
        </span>
      </div>

      <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text, marginTop: "6px" }}>
        {task.title}
      </div>

      {task.description ? (
        <div
          style={{
            fontSize: "13px",
            color: colors.subtext,
            marginTop: "4px",
          }}
        >
          {task.description}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Avatar name={personName} size="xs" />
          <span style={{ fontSize: "12px", color: colors.text }}>{personName}</span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: "4px",
            padding: "2px 8px",
          }}
        >
          {statusLabel(task.status)}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: `1px solid ${colors.border}`,
          fontSize: "11px",
          color: colors.subtext,
        }}
      >
        <span>Assigned {formatDate(task.created_at)}</span>
        <span>Due {formatDate(task.due_date)}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task details modal                                                        */
/*  Editing logic below mirrors the original TaskModal exactly:               */
/*  employees may only change status + employee_remarks, admins may change    */
/*  everything. No API/service/permission logic has been altered.             */
/*  Styling only: plain white, no blur, no shadow-2xl, no animation.          */
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

  const inputStyle: React.CSSProperties = {
    height: "36px",
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    background: colors.bg,
    padding: "0 10px",
    fontSize: "14px",
    color: colors.text,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "4px",
    fontSize: "12px",
    fontWeight: 500,
    color: colors.subtext,
  };

  /* ------------------------------------------------------------------
     Responsive shell:
     - Mobile (default, <768px): panel is fixed to the bottom on its own,
       NOT dependent on a flex-centered parent. This is a plain bottom
       sheet — the thing Android WebView failed to paint was the
       fixed+flex-center+large-scroll-content combo, so mobile now
       avoids that combo entirely.
     - Tablet/Desktop (>=768px): overlay switches to flex centering and
       the panel becomes a normal-flow centered box (classic modal).
     No transform, no backdrop-filter, no position:sticky anywhere.
     Header/footer stay pinned purely via flex-column + flex:1 on body.
  ------------------------------------------------------------------ */

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle — visible on mobile only (hidden >=768px via CSS) */}
        <div className="task-modal-handle" />

        {/* Header — fixed, outside the form, never scrolls, never gets focus-scrolled */}
        <div className="task-modal-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: colors.subtext }}>
                {task?.task_code ?? (isEdit ? `TASK-${task.id}` : "New task")}
              </span>
              {isEdit && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "4px",
                    padding: "2px 6px",
                    color: colors.text,
                  }}
                >
                  {statusLabel(status)}
                </span>
              )}
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "4px",
                  padding: "2px 6px",
                  color: colors.text,
                }}
              >
                {PRIORITY_LABEL[priority] ?? priority}
              </span>
            </div>
            {isAdmin ? (
              <input
                required
                form="task-details-form"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                style={{
                  marginTop: "8px",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: colors.text,
                  outline: "none",
                }}
              />
            ) : (
              <div style={{ marginTop: "8px", fontSize: "17px", fontWeight: 600, color: colors.text }}>
                {title}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            {isAdmin && isEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="task-modal-icon-btn"
                style={{ color: "#b91c1c" }}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="task-modal-icon-btn"
              style={{ color: colors.subtext }}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form — ONLY wraps the scrollable body. This is the ONLY scroll region. */}
        <form
          id="task-details-form"
          onSubmit={submit}
          className="task-modal-body"
        >
          {/* General Information */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext, marginBottom: "8px" }}>
              GENERAL INFORMATION
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {isAdmin && (
                <div style={{ flex: "1 1 160px" }}>
                  <label style={labelStyle}>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              )}
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext, marginBottom: "8px" }}>
              ASSIGNMENT INFORMATION
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {isAdmin ? (
                <div style={{ flex: "1 1 160px" }}>
                  <label style={labelStyle}>Assigned To</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={inputStyle}>
                    {assignees.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ flex: "1 1 160px" }}>
                  <label style={labelStyle}>Assigned To</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "14px",
                      color: colors.text,
                    }}
                  >
                    {assignedEmployee && (
                      <Avatar
                        name={`${assignedEmployee.first_name} ${assignedEmployee.last_name}`}
                        size="xs"
                      />
                    )}
                    <span>
                      {assignedEmployee
                        ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Assigned By</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "36px",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "0 10px",
                    fontSize: "14px",
                    color: colors.text,
                  }}
                >
                  {task?.assigned_by_name && <Avatar name={task.assigned_by_name} size="xs" />}
                  <span>{task?.assigned_by_name ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext, marginBottom: "8px" }}>
              TIMELINE
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Assigned Date</label>
                <div
                  style={{
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    padding: "0 10px",
                    fontSize: "14px",
                    color: colors.text,
                  }}
                >
                  {formatDate(task?.created_at)}
                </div>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!isAdmin}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <label style={labelStyle}>Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!isAdmin}
                  style={inputStyle}
                />
              </div>
              {task?.completed_at && (
                <div style={{ flex: "1 1 160px" }}>
                  <label style={labelStyle}>Completed Date</label>
                  <div
                    style={{
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      padding: "0 10px",
                      fontSize: "14px",
                      color: colors.text,
                    }}
                  >
                    {formatDate(task.completed_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext, marginBottom: "8px" }}>
              DESCRIPTION
            </div>
            {isAdmin ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add a description…"
                style={{
                  width: "100%",
                  resize: "none",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  background: colors.bg,
                  padding: "8px 10px",
                  fontSize: "14px",
                  color: colors.text,
                  outline: "none",
                }}
              />
            ) : (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "14px",
                  color: colors.text,
                }}
              >
                {description || "No description provided."}
              </div>
            )}
          </div>

          {/* Employee Remarks */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext, marginBottom: "8px" }}>
              EMPLOYEE REMARKS
            </div>
            {isAdmin ? (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  padding: "8px 10px",
                  fontSize: "14px",
                  color: colors.text,
                }}
              >
                {employeeRemarks || "No remarks yet."}
              </div>
            ) : (
              <textarea
                value={employeeRemarks}
                onChange={(e) => setEmployeeRemarks(e.target.value)}
                rows={4}
                placeholder="Add a work update or completion remarks…"
                style={{
                  width: "100%",
                  resize: "none",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  background: colors.bg,
                  padding: "8px 10px",
                  fontSize: "14px",
                  color: colors.text,
                  outline: "none",
                }}
              />
            )}
          </div>

          {isEdit && (task?.created_at || task?.updated_at) && (
            <div
              style={{
                display: "flex",
                gap: "16px",
                borderTop: `1px solid ${colors.border}`,
                paddingTop: "10px",
                fontSize: "11px",
                color: colors.subtext,
              }}
            >
              {task?.created_at && <span>Created {formatDate(task.created_at)}</span>}
              {task?.updated_at && <span>Updated {formatDate(task.updated_at)}</span>}
            </div>
          )}
        </form>

        {/* Footer — fixed, outside the form; Save submits via form="task-details-form" */}
        <div className="task-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="task-modal-btn task-modal-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-details-form"
            disabled={saving}
            className="task-modal-btn task-modal-btn-primary"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}