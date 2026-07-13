import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/task-add")({
  component: AddTaskPage,
});

function AddTaskPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <h1 className="text-3xl font-bold">Add Task</h1>

      <p className="mt-2 text-muted-foreground">
        Create and assign a new task.
      </p>
    </div>
  );
}