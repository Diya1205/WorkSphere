import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route. Its only job is to render whichever child route matched:
//   /live/tasks        -> _app.live.tasks.index.tsx      (list page)
//   /live/tasks/$taskId -> _app.live.tasks.$taskId.tsx    (details page)
// Do NOT put page content here — this file must stay a pure passthrough,
// otherwise the child route renders "underneath" this component instead
// of replacing it, which is exactly the bug we just fixed.
export const Route = createFileRoute("/_app/live/tasks")({
  component: () => <Outlet />,
});