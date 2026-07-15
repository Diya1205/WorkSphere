import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { TaskForm } from "@/components/hrms/TaskForm";
import { getEmployees } from "@/services/employeeService";
import { colors, getCurrentUser } from "@/lib/taskHelpers";

export const Route = createFileRoute("/_app/task-add")({
  component: TaskAddPage,
  head: () => ({ meta: [{ title: "Add Task · TirthInfotech" }] }),
});

function TaskAddPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .finally(() => setLoading(false));
  }, []);

  const goBack = () => navigate({ to: "/live/tasks" });

  if (!isAdmin) {
    return (
      <div style={{ background: colors.page, minHeight: "100%" }}>
        <PageHeader
          title="Add Task"
          description="Assign a new task to an employee."
          breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Tasks" }, { label: "Add" }]}
        />
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 16px", textAlign: "center", color: colors.subtext, fontSize: "14px" }}>
          Only admins can create tasks.
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: colors.page, minHeight: "100%" }}>
      <PageHeader
        title="Add Task"
        description="Assign a new task to an employee."
        breadcrumbs={[{ label: "Home" }, { label: "Live" }, { label: "Tasks", href: "/live/tasks" }, { label: "Add" }]}
      />

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px 16px 32px" }}>
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
          <ArrowLeft className="h-4 w-4" /> Back
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
        ) : (
          <TaskForm
            mode="create"
            employees={employees}
            isAdmin={isAdmin}
            onCancel={goBack}
            onSuccess={() => goBack()}
          />
        )}
      </div>
    </div>
  );
}