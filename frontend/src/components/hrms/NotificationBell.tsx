import { Bell, CheckCheck, X, Info, CheckCircle2, AlertTriangle, MessageSquare, CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";

// Small helper to pick a sensible icon per notification type without
// touching any backend contract — purely presentational.
function NotificationTypeIcon({ type }: { type: string }) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("leave")) return <CalendarClock className="h-4 w-4" />;
  if (t.includes("approve") || t.includes("success")) return <CheckCircle2 className="h-4 w-4" />;
  if (t.includes("warn") || t.includes("alert") || t.includes("reject")) return <AlertTriangle className="h-4 w-4" />;
  if (t.includes("message") || t.includes("chat")) return <MessageSquare className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

export function NotificationBell() {
  
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const pathname = useRouterState({
  select: (state) => state.location.pathname,
});
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

  const panel = (
    <div
      className={cn(
        "flex flex-col border border-border bg-background shadow-xl",
        isMobile
          ? ""
          : "absolute right-0 mt-2 z-50 max-h-[480px] w-[380px] rounded-xl",
      )}
      
      role="dialog"
      aria-label="Notifications"
    >
      {isMobile && (
        <div className="flex justify-center pb-1 pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:py-3">
        <h3 className="text-base font-semibold">Notifications</h3>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {notifications.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 sm:text-sm"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Read all</span>
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {notifications.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        )}

        {notifications.map((notification) => (
          <button
            key={notification.id}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border/60 px-4 text-left transition hover:bg-accent",
              isMobile ? "py-4 active:bg-accent/70" : "py-3.5 sm:py-4",
              !notification.is_read && "bg-primary/5",
            )}
            onClick={() => handleItemClick(notification)}
          >
            <span
              className={cn(
                "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                notification.is_read
                  ? "bg-accent text-muted-foreground"
                  : "bg-primary-soft text-primary",
              )}
            >
              <NotificationTypeIcon type={notification.notification_type} />
            </span>

            <div className="min-w-0 flex-1">
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

              <div className="mt-1.5 text-xs text-muted-foreground">
                {notification.time_ago}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => {
  if (pathname === "/notifications") {
    return;
  }

  if (isMobile) {
    navigate({ to: "/notifications" });
  } else {
    setOpen((prev) => !prev);
  }
}}
        className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent"
      >
        <Bell className="h-4 w-4" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && !isMobile && pathname !== "/notifications" && (
  <>
    <button
      className="fixed inset-0 z-40 cursor-default bg-transparent"
      onClick={() => setOpen(false)}
      aria-label="Close notifications"
    />

    {panel}
  </>
)}
    </div>
  );
}