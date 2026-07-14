import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, MessageSquare, CheckSquare, Flame } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { getTasks } from "@/services/task";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [{ title: "Tasks · TirthInfotech" }],
  }),
});

const columns = [
  { id: "TODO", label: "To Do", accent: "bg-info" },
  { id: "IN_PROGRESS", label: "In Progress", accent: "bg-primary" },
  { id: "COMPLETED", label: "Completed", accent: "bg-success" },
];

const priorityStyle: Record<string, string> = {
  LOW: "text-muted-foreground bg-muted",
  MEDIUM: "text-info bg-info-soft",
  HIGH: "text-warning bg-warning-soft",
  URGENT: "text-danger bg-danger-soft",
};

function TaskCard({
  t,
  onEdit,
}: {
  t: any;
  onEdit: (task: any) => void;
}) {

  return (
    <div
      onClick={() => onEdit(t)} className="group cursor-pointer rounded-lg border border-border bg-surface p-3.5 shadow-[var(--shadow-resting)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", priorityStyle[t.priority])}>
          {t.priority === "urgent" && <Flame className="h-2.5 w-2.5" />}
          {t.priority}
        </span>
        <button className="grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100" aria-label="Task menu">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>
      <h4 className="mt-2 text-sm font-medium leading-snug text-foreground">{t.title}</h4>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {t.task_code}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> {t.status}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Remarks</span>
          <span className="tabular">Due {t.due_date}</span>
        </div>
        <Avatar
          name={t.assigned_to_name ?? "Employee"}
          size="xs"
        />
      </div>
    </div>
  );
}

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const data = await getTasks();
    setTasks(data);
  }
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Cross-team work across HRMS v3, Platform, Payroll and Reports"
        breadcrumbs={[{ label: "Home" }, { label: "Work" }, { label: "Tasks" }]}
        actions={
          <Link
            to="/task-add"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Link>
        }
      />

      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((col) => {
            const colTasks = tasks.filter(
              (t: any) => t.status === col.id
            );
            return (
              <div key={col.id} className="flex min-h-[420px] flex-col rounded-xl border border-border bg-background/60 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", col.accent)} />
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular">{colTasks.length}</span>
                  </div>
                  <button className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-accent" aria-label={`Add to ${col.label}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {colTasks.map((t: any) => (
                    <TaskCard
                      key={t.id}
                      t={t}
                      onEdit={(task) => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
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
      </div>
      {modalOpen && (
        <TaskModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          task={editingTask}
          onSaved={() => {
            loadTasks();
            setModalOpen(false);
          }}
        />
      )}
    </>

  );
}
