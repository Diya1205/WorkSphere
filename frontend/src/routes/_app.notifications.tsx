import { createFileRoute } from "@tanstack/react-router";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: notifications = [] } = useNotifications();

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className="mb-3 rounded-xl border bg-background p-4 shadow-sm"
          >
            <div className="font-semibold">
              {notification.title}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              {notification.message}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {notification.time_ago}
            </div>
          </div>
        ))
      )}
    </div>
  );
}