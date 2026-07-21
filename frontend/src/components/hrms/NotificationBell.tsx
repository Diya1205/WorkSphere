import { Bell, CheckCheck, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";

export function NotificationBell() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useNotifications();
  const { data: unread = 0 } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleItemClick = (notification: (typeof notifications)[number]) => {
    markRead.mutate(notification.id);
    setOpen(false);
    if (notification.action_url) {
      navigate({ to: notification.action_url });
    }
  };

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
        <>
          {/* Tap-away backdrop; also gives mobile the sheet-dimming feel */}
          <button
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />

          <div
            className={cn(
              "z-50 flex flex-col rounded-xl border border-border bg-background shadow-xl",
              isMobile
                ? "fixed inset-x-3 bottom-3 top-auto max-h-[75vh] rounded-2xl"
                : "absolute right-0 mt-2 max-h-[480px] w-[380px]",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:p-4">
              <h3 className="text-sm font-semibold sm:text-base">Notifications</h3>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline sm:text-sm"
                  >
                    <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Mark all read</span>
                    <span className="xs:hidden">Read all</span>
                  </button>
                )}
                {isMobile && (
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {notifications.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              )}

              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    "w-full border-b border-border/60 px-4 py-3.5 text-left transition hover:bg-accent sm:py-4",
                    !notification.is_read && "bg-primary/5",
                  )}
                  onClick={() => handleItemClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 break-words text-sm font-medium leading-snug">
                      {notification.title}
                    </div>
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="mt-1 break-words text-sm leading-snug text-muted-foreground">
                    {notification.message}
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    {notification.time_ago}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}