import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { getTasks } from "@/services/task";
import { getEmployees } from "@/services/employeeService";
import {
  colors,
  STATUS_COLUMNS,
  PRIORITY_LABEL,
  statusLabel,
  formatDate,
  getCurrentUser,
} from "@/lib/taskHelpers";

export const Route = createFileRoute("/_app/live/tasks/")({
  component: LiveTasksPage,
  head: () => ({ meta: [{ title: "Tasks · TirthInfotech" }] }),
});

function LiveTasksPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const user = getCurrentUser();
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [taskData, employeeData] = await Promise.all([
        getTasks(),
        getEmployees(),
      ]);
      setTasks(taskData);
      setEmployees(employeeData);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.task_code?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    });
  }, [tasks, search, statusFilter]);

  const goToDetails = (id: number) => navigate({ to: `/live/tasks/${id}` });
  const goToAdd = () => navigate({ to: "/task-add" });

  return (
    <div style={{ background: colors.page, minHeight: "100%" }}>
      <PageHeader
        title="Tasks"
        description="Manage employee tasks"
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Tasks" }]}
        actions={
          isAdmin ? (
            <button
              onClick={goToAdd}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "36px",
                padding: "0 12px",
                background: colors.primary,
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
        {/* Status Summary Cards */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {STATUS_COLUMNS.map((col) => (
            <button
              key={col.id}
              onClick={() =>
                setStatusFilter((prev) => (prev === col.id ? "ALL" : col.id))
              }
              style={{
                flex: "1 1 140px",
                background: colors.bg,
                border: `1px solid ${statusFilter === col.id ? colors.primary : colors.border}`,
                borderRadius: "8px",
                padding: "14px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "20px", fontWeight: 700, color: colors.text }}>
                {statusCounts[col.id]}
              </div>
              <div style={{ fontSize: "12px", color: colors.subtext, marginTop: "4px" }}>
                {col.label}
              </div>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 220px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "38px",
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "0 12px",
              background: colors.bg,
            }}
          >
            <Search className="h-4 w-4" color={colors.subtext} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or code…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: colors.text,
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: "38px",
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "0 10px",
              fontSize: "14px",
              color: colors.text,
              background: colors.bg,
            }}
          >
            <option value="ALL">All statuses</option>
            {STATUS_COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
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
        ) : filteredTasks.length === 0 ? (
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "60px 0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "14px", color: colors.subtext }}>
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your search/filter"}
            </div>
            {isAdmin && tasks.length === 0 && (
              <button
                onClick={goToAdd}
                style={{
                  marginTop: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  height: "36px",
                  padding: "0 12px",
                  background: colors.primary,
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
            {filteredTasks.map((t: any) => (
              <TaskRow
                key={t.id}
                task={t}
                employees={employees}
                isAdmin={isAdmin}
                onOpen={() => goToDetails(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Task row — display only, no editing logic, navigates to details page      */
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "10px",
        cursor: "pointer",
        minHeight: "44px", // large touch target
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
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
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