import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Avatar } from "@/components/hrms/Avatar";
import {
  createTask,
  updateTask,
  updateTaskStatus,
} from "@/services/task";
import {
  colors,
  formatDate,
  statusLabel,
  PRIORITY_LABEL,
} from "@/lib/taskHelpers";

/* -------------------------------------------------------------------------- */
/*  Shared inline styles                                                      */
/* -------------------------------------------------------------------------- */

const inputStyle: React.CSSProperties = {
  height: "40px",
  width: "100%",
  border: `1px solid ${colors.border}`,
  borderRadius: "6px",
  background: colors.bg,
  padding: "0 12px",
  fontSize: "14px",
  color: colors.text,
};

const readonlyBoxStyle: React.CSSProperties = {
  minHeight: "40px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  border: `1px solid ${colors.border}`,
  borderRadius: "6px",
  padding: "0 12px",
  fontSize: "14px",
  color: colors.text,
  background: "#f9fafb",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "12px",
  fontWeight: 500,
  color: colors.subtext,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: colors.subtext,
  letterSpacing: "0.03em",
  marginBottom: "12px",
};

function Field({
  label,
  children,
  flex = "1 1 220px",
}: {
  label: string;
  children: React.ReactNode;
  flex?: string;
}) {
  return (
    <div style={{ flex }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        padding: "18px",
        marginBottom: "16px",
      }}
    >
      <div style={sectionTitleStyle}>{title}</div>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  TaskForm                                                                   */
/* -------------------------------------------------------------------------- */

export type TaskFormMode = "create" | "edit";

export interface TaskFormProps {
  mode: TaskFormMode;
  task?: any | null;
  employees: any[];
  isAdmin: boolean;
  onSuccess: (task: any) => void;
  onCancel: () => void;
  onDelete?: (id: number) => void;
  /** Renders the Save/Create + Cancel buttons as a sticky bottom bar on mobile */
  stickyActionsOnMobile?: boolean;
}

export function TaskForm({
  mode,
  task,
  employees,
  isAdmin,
  onSuccess,
  onCancel,
  onDelete,
  stickyActionsOnMobile = true,
}: TaskFormProps) {
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState<string>(
    String(task?.assigned_to ?? employees[0]?.id ?? "")
  );
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState(task?.status ?? "TODO");
  const [startDate, setStartDate] = useState(task?.start_date ?? "");
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? "");
  const today = new Date().toISOString().split("T")[0];
  const [employeeRemarks, setEmployeeRemarks] = useState(
    task?.employee_remarks ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedEmployee = employees.find((e) => e.id === task?.assigned_to);

  // Employees may only ever change Status + Employee Remarks (+ Start Date,
  // consistent with the original modal's updateTaskStatus payload). Admins
  // can change everything. This mirrors the existing business logic exactly.
  const canEditCore = isEdit ? isAdmin : true;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isEdit && !isAdmin && !employeeRemarks && status === task?.status) {
      // no-op guard removed on purpose — employees may save status-only or
      // remarks-only changes; nothing to validate here.
    }

    setSaving(true);
    try {
      if (isEdit) {
        if (isAdmin) {
          const payload = {
            title,
            description,
            assigned_to: Number(assigneeId),
            priority: priority.toUpperCase(),
            status: status.toUpperCase(),
            start_date: startDate || null,
            due_date: dueDate,
            employee_remarks: employeeRemarks,
          };
          const updated = await updateTask(task.id, payload);
          onSuccess(updated);
        } else {
          const updated = await updateTaskStatus(task.id, {
            status: status.toUpperCase(),
            employee_remarks: employeeRemarks,
            start_date: startDate || null,
          });
          onSuccess(updated);
        }
      } else {
        if (!isAdmin) {
          setError("Only admins can create tasks.");
          return;
        }
        const payload = {
          title,
          description,
          assigned_to: Number(assigneeId),
          priority: priority.toUpperCase(),
          status: "TODO",
          start_date: startDate || null,
          due_date: dueDate,
          employee_remarks: "",
        };
        const created = await createTask(payload);
        onSuccess(created);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to save task. Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      id="task-form"
      onSubmit={submit}
      style={{ paddingBottom: stickyActionsOnMobile ? "84px" : 0 }}
    >
      {error && (
        <div
          style={{
            marginBottom: "16px",
            border: `1px solid #fecaca`,
            background: "#fef2f2",
            color: colors.danger,
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* General Information */}
      <Section title="GENERAL INFORMATION">
        <Field label="Task Code">
          <div style={readonlyBoxStyle}>
            {task?.task_code ?? "Auto-generated on save"}
          </div>
        </Field>

        <Field label="Title" flex="1 1 100%">
          {canEditCore ? (
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Create HRMS Website"
              style={inputStyle}
            />
          ) : (
            <div style={readonlyBoxStyle}>{title}</div>
          )}
        </Field>

        {isEdit && (
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </Field>
        )}

        <Field label="Priority">
          {canEditCore ? (
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={inputStyle}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          ) : (
            <div style={readonlyBoxStyle}>
              {PRIORITY_LABEL[priority] ?? priority}
            </div>
          )}
        </Field>

        <Field label="Description" flex="1 1 100%">
          {canEditCore ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a description…"
              style={{
                width: "100%",
                resize: "vertical",
                border: `1px solid ${colors.border}`,
                borderRadius: "6px",
                background: colors.bg,
                padding: "10px 12px",
                fontSize: "14px",
                color: colors.text,
              }}
            />
          ) : (
            <div style={{ ...readonlyBoxStyle, alignItems: "flex-start", padding: "10px 12px", whiteSpace: "pre-wrap" }}>
              {description || "No description provided."}
            </div>
          )}
        </Field>
      </Section>

      {/* Assignment */}
      <Section title="ASSIGNMENT">
        <Field label="Assigned To">
          {canEditCore ? (
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              style={inputStyle}
            >
              {employees.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          ) : (
            <div style={readonlyBoxStyle}>
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
          )}
        </Field>

        {isEdit && (
          <Field label="Assigned By">
            <div style={readonlyBoxStyle}>
              {task?.assigned_by_name && (
                <Avatar name={task.assigned_by_name} size="xs" />
              )}
              <span>{task?.assigned_by_name ?? "—"}</span>
            </div>
          </Field>
        )}
      </Section>

      {/* Timeline */}
      <Section title="TIMELINE">
        {isEdit && (
          <Field label="Assigned Date">
            <div style={readonlyBoxStyle}>{formatDate(task?.created_at)}</div>
          </Field>
        )}

        <Field label="Start Date">
          {canEditCore || !isEdit ? (
            <input
              type="date"
              value={startDate}
              min={today}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);
              
                // If due date is before the selected start date, clear it
                if (dueDate && value && dueDate < value) {
                  setDueDate("");
                }
              }}
              disabled={isEdit && !isAdmin}
              style={inputStyle}
            />
          ) : (
            <div style={readonlyBoxStyle}>{formatDate(startDate)}</div>
          )}
        </Field>

        <Field label="Due Date">
          {canEditCore ? (
            <input
              type="date"
              required
              value={dueDate}
              min={startDate || today}
              onChange={(e) => setDueDate(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <div style={readonlyBoxStyle}>{formatDate(dueDate)}</div>
          )}
        </Field>

        {isEdit && task?.completed_at && (
          <Field label="Completed Date">
            <div style={readonlyBoxStyle}>{formatDate(task.completed_at)}</div>
          </Field>
        )}
      </Section>

      {/* Employee Remarks — only shown in edit mode */}
      {isEdit && (
        <Section title="EMPLOYEE REMARKS">
          <Field label="" flex="1 1 100%">
            {isAdmin ? (
              <div
                style={{
                  ...readonlyBoxStyle,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  whiteSpace: "pre-wrap",
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
                  resize: "vertical",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  background: colors.bg,
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: colors.text,
                }}
              />
            )}
          </Field>
        </Section>
      )}

      {isEdit && (task?.created_at || task?.updated_at) && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "11px",
            color: colors.subtext,
            marginBottom: "16px",
          }}
        >
          {task?.created_at && <span>Created {formatDate(task.created_at)}</span>}
          {task?.updated_at && <span>Updated {formatDate(task.updated_at)}</span>}
        </div>
      )}

      {/* Actions */}
      <div
        className="task-form-actions"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          ...(stickyActionsOnMobile
            ? {
                position: "sticky",
                bottom: 0,
                background: colors.page,
                paddingTop: "12px",
                paddingBottom: "env(safe-area-inset-bottom, 12px)",
              }
            : {}),
        }}
      >
        <div>
          {isEdit && isAdmin && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "40px",
                padding: "0 14px",
                background: "#fff",
                color: colors.danger,
                border: `1px solid #fecaca`,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: "40px",
              padding: "0 18px",
              background: "#fff",
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "40px",
              padding: "0 18px",
              background: colors.primary,
              color: colors.primaryText,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? (saving ? "Saving…" : "Save Changes") : saving ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </form>
  );
}