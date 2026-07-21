import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";

export function NotificationBell() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useNotifications();

  const { data: unread = 0 } = useUnreadNotificationCount();

  const markRead = useMarkNotificationRead();

  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent"
      >
        <Bell className="h-4 w-4" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] rounded-xl border border-border bg-background shadow-xl">

          <div className="flex items-center justify-between border-b p-4">

            <h3 className="font-semibold">
              Notifications
            </h3>

            {notifications.length > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[450px] overflow-y-auto">

            {notifications.length === 0 && (

              <div className="p-8 text-center text-sm text-muted-foreground">

                No notifications yet.

              </div>

            )}

            {notifications.map((notification) => (

              <button
                key={notification.id}
                className={`w-full border-b p-4 text-left transition hover:bg-accent ${
                  !notification.is_read
                    ? "bg-primary/5"
                    : ""
                }`}
                onClick={() => {

                  markRead.mutate(notification.id);

                  setOpen(false);

                  if (notification.action_url) {

                    navigate({
                      to: notification.action_url,
                    });

                  }

                }}
              >

                <div className="flex items-start justify-between">

                  <div className="font-medium">

                    {notification.title}

                  </div>

                  {!notification.is_read && (

                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />

                  )}

                </div>

                <div className="mt-1 text-sm text-muted-foreground">

                  {notification.message}

                </div>

                <div className="mt-2 text-xs text-muted-foreground">

                  {notification.time_ago}

                </div>

              </button>

            ))}

          </div>

        </div>
      )}
    </div>
  );
}