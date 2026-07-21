import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Building2, CheckSquare, Clock, CalendarDays,
  Wallet,  Video, MessageSquare,  
  Settings, Search, Bell, ChevronDown, ChevronsLeft, Sun, Moon, Menu, X, LogOut,
  Sparkles,User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { NotificationBell } from "./NotificationBell";

type Roles = AppRole[];
interface NavItem {
  label: string; to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number; roles?: Roles; live?: boolean;
}
interface NavGroup { label: string; items: NavItem[]; }

const nav: NavGroup[] = [
  { label: "Live", items: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, live: true },
    { label: "Tasks", to: "/live/tasks", icon: CheckSquare, live: true },
    { label: "Meetings", to: "/live/meetings", icon: Video, live: true },
    { label: "Directory", to: "/live/directory", icon: Users, live: true, roles: ["admin"] },
  ]},
  { label: "Overview (demo)", items: [
    { label: "Home", to: "/", icon: Sparkles },
  ]},
  { label: "People (demo)", items: [
    { label: "Employees", to: "/employees", icon: Users },
    { label: "Departments", to: "/departments", icon: Building2 },

  ]},
  { label: "Time (demo)", items: [
    { label: "Attendance", to: "/attendance", icon: Clock },
    { label: "Leave", to: "/leave", icon: CalendarDays, badge: 3 },
    { label: "Messages", to: "/messages", icon: MessageSquare, badge: 12 },

  ]},
  { label: "Finance (demo)", items: [
    { label: "Payroll", to: "/payroll", icon: Wallet },
  ]},
  { label: "Admin (demo)", items: [
    { label: "Settings", to: "/settings", icon: Settings },
  ]},
];

const roleLabel: Record<AppRole, string> = { admin: "Admin", manager: "Manager", employee: "Employee" };
const roleTone: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary",
  manager: "bg-warning-soft text-warning",
  employee: "bg-info-soft text-info",
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => { setMobileOpen(false); setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const role: AppRole = me?.role ?? "employee";

  const handleLogout = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    
    localStorage.removeItem("access");
    
    toast.success("Signed out");
    
    router.navigate({
      to: "/auth",
      replace: true,
    });
  };

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}>
        <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">T</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Tirth Infotech</div>
                <div className="truncate text-[11px] text-muted-foreground">People Platform</div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {nav.map((group) => {
            const items = group.items.filter((it) => !it.roles || it.roles.includes(role));
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="mb-4">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {items.map((it) => {
                    const active = it.to === "/" ? pathname === "/" : pathname === it.to || pathname.startsWith(it.to + "/");
                    const Icon = it.icon;
                    return (
                      <li key={it.to}>
                        <Link
                          to={it.to}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            active ? "bg-primary-soft text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent",
                            collapsed && "justify-center px-0",
                          )}
                          title={collapsed ? it.label : undefined}
                        >
                          {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary" />}
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                          {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                          {!collapsed && it.live && (
                            <span className="ml-auto rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-semibold text-success">LIVE</span>
                          )}
                          {!collapsed && !it.live && it.badge && (
                            <span className="ml-auto rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger tabular">
                              {it.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border p-3", collapsed && "px-2")}>
          {collapsed ? (
            <div className="flex justify-center">
              <Avatar name={me?.fullName ?? "User"} size="sm" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-md p-2">
              <Avatar name={me?.fullName ?? "User"} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{me?.fullName ?? "…"}</div>
                <div className="truncate text-[11px] text-muted-foreground">{me ? roleLabel[me.role] : ""}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 pt-4 backdrop-blur lg:px-6 lg:pt-0"
            style={{
              paddingTop: "max(env(safe-area-inset-top), 16px)",
              minHeight: "80px",
            }}
          >
          <button onClick={() => setMobileOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent lg:hidden" aria-label="Open menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button onClick={() => setCollapsed((v) => !v)} className="hidden h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent lg:grid" aria-label="Collapse sidebar">
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" placeholder="Search people, tasks…" className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-14 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular">⌘K</kbd>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setDark((v) => !v)} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent" aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell />
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => {
                  console.log("Avatar clicked");
                  setMenuOpen((v) => !v);
                }}
                className="flex items-center gap-2 rounded-md p-1 hover:bg-accent"
              >
                <Avatar name={me?.fullName ?? "User"} size="sm" />
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {menuOpen && me && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg">
                  <div className="border-b border-border p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={me.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{me.fullName}</div>
                        <div className="truncate text-xs text-muted-foreground">{me.email}</div>
                      </div>
                    </div>
                    <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", roleTone[me.role])}>
                      {roleLabel[me.role]}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);

    router.navigate({
      to: "/profile",
    });
  }}
  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1"><Outlet /></main>
      </div>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
