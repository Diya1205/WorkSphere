import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { TaskForm } from "@/components/hrms/TaskForm";
import { getTask, deleteTask } from "@/services/task";
import { getEmployees } from "@/services/employeeService";
import {
  colors,
  PRIORITY_LABEL,
  statusLabel,
  getCurrentUser,
} from "@/lib/taskHelpers";

export const Route = createFileRoute("/_app/live/tasks/$taskId")({
  component: TaskDetailsPage,
  head: () => ({ meta: [{ title: "Task Details · TirthInfotech" }] }),
});

function badgeStyle(): React.CSSProperties {
  return {
    fontSize: "11px",
    fontWeight: 600,
    border: `1px solid ${colors.border}`,
    borderRadius: "999px",
    padding: "3px 10px",
    color: colors.text,
    background: "#fff",
  };
}

function TaskDetailsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const user = getCurrentUser();
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const load = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [taskData, employeeData] = await Promise.all([
        getTask(Number(taskId)),
        getEmployees(),
      ]);
      setTask(taskData);
      setEmployees(employeeData);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate({ to: "/live/tasks" });

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      goBack();
    } catch (err) {
      console.error(err);
      alert("Failed to delete task.");
    }
  };

  return (
    <div style={{ background: colors.page, minHeight: "100%" }}>
      <PageHeader
        title="Task Details"
        description={task ? task.title : "Loading task…"}
        breadcrumbs={[
          { label: "Home" },
          { label: "Live" },
          { label: "Tasks", href: "/live/tasks" },
          { label: task?.task_code ?? "Details" },
        ]}
      />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px 16px 32px" }}>
        <button
          onClick={goBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 500,
            color: colors.subtext,
            background: "none",
            border: "none",
            padding: "6px 0",
            marginBottom: "12px",
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </button>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "80px 0",
              color: colors.subtext,
            }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : notFound || !task ? (
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              padding: "60px 0",
              textAlign: "center",
              color: colors.subtext,
              fontSize: "14px",
            }}
          >
            Task not found, or you don't have access to it.
          </div>
        ) : (
          <>
            {/* Header card: code, title, badges */}
            <div
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600, color: colors.subtext }}>
                {task.task_code}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: colors.text, marginTop: "4px" }}>
                {task.title}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                <span style={badgeStyle()}>{PRIORITY_LABEL[task.priority] ?? task.priority}</span>
                <span style={badgeStyle()}>{statusLabel(task.status)}</span>
              </div>
            </div>

            <TaskForm
              mode="edit"
              task={task}
              employees={employees}
              isAdmin={isAdmin}
              onCancel={goBack}
              onDelete={isAdmin ? handleDelete : undefined}
              onSuccess={(updated) => {
                setTask(updated);
                goBack();
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}