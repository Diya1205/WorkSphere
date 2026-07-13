import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Clock, Play, Square as StopIcon, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/services/api";
export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Attendance · Northwind IT" }] }),
});


type Status =
  | "PRESENT"
  | "ABSENT";

type Row = {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: string | null;
  working_hours_display: string | null;
  status: Status;
  location: string | null;
};
const short: Record<Status, string> = {
  PRESENT: "P",
  ABSENT: "A",
};
const statusMap: Record<Status, { label: string; className: string }> = {
  PRESENT: {
    label: "Present",
    className: "bg-success/90 text-success-foreground",
  },

  ABSENT: {
    label: "Absent",
    className: "bg-danger/90 text-danger-foreground",
  },

};
function toLocalISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function AttendancePage() {
  const currentUser = useCurrentUser();

  console.log(currentUser);

  const me = currentUser.data;
  const qc = useQueryClient();
  const today = toLocalISODate(new Date());
  const monthStart = useMemo(() => {
  const d = new Date();

  return toLocalISODate(
    new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    )
  );
}, []);
  const monthEnd = useMemo(() => {
  const d = new Date();

  return toLocalISODate(
    new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0
    )
  );
}, []);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["attendance"],

    queryFn: async () => {
      const response = await api.get("/attendance/");
      return response.data;
    },
  });

  

  const todayRow =
  rows.find(
    (r: Row) =>
      r.date === today &&
      r.employee === me?.employeeId
  ) ?? null;

  const checkIn = useMutation({
    mutationFn: async () => {
      await api.post("/attendance/", {});
    },

    onSuccess: async () => {
      await qc.refetchQueries({
        queryKey: ["attendance"],
      });

      toast.success("Checked In");
    },
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      await api.post("/attendance/", {});
    },

    onSuccess: async () => {
      await qc.refetchQueries({
        queryKey: ["attendance"],
      });

      toast.success("Checked Out");
    },

    onError: (error: any) => {
      console.log(error.response?.data);
      toast.error(JSON.stringify(error.response?.data));
    }
  });

  const isEmployee = me?.role === "EMPLOYEE";

  // Group rows by user for grid view
  const grouped = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      if (!map.has(String(r.employee))) {
        map.set(String(r.employee), []);
      }

      map.get(String(r.employee))!.push(r);
    }
    // For employee, only self
    return Array.from(map.entries());
  }, [rows, isEmployee, me]);

  const todayStats = useMemo(() => {
    const t = rows.filter((r: Row) => r.date === today);

    return {
      present: t.filter(
        (r: Row) => r.status === "PRESENT"
      ).length,

      absent: t.filter(
        (r: Row) => r.status === "ABSENT"
      ).length,
    };
  }, [rows, today]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const checkedIn = !!todayRow?.check_in && !todayRow?.check_out;

  const checkInTime = todayRow?.check_in
    ? new Date(todayRow.check_in).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "--:--";

  const checkOutTime = todayRow?.check_out
    ? new Date(todayRow.check_out).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    : "--:--";

  const workingHours = todayRow?.working_hours_display ?? "--";

  const attendanceStatus = todayRow?.status ?? "--";

  return (
    <>
      <PageHeader
        title="Attendance"
        description={isEmployee ? "Your check-ins for the current month" : "Team attendance for the current month"}
        breadcrumbs={[{ label: "Home" }, { label: "Time" }, { label: "Attendance" }]}
      />

      <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-6 lg:px-8">

        {isEmployee ? (

          <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-10 text-white shadow-xl">
            <div className="grid grid-cols-[320px_1fr_220px] items-center gap-10">

              {/* Left */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-white/80">
                  Today · {today}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="text-5xl font-bold tabular">
                    {checkInTime}
                  </div>

                  <div
                    className={cn(
                      "inline-flex h-9 items-center rounded-full px-5 text-sm font-semibold shadow-sm",
                      attendanceStatus === "PRESENT"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    )}
                  >
                    {attendanceStatus === "PRESENT" ? "Present" : "Absent"}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="h-4 w-4" />
                  {todayRow?.location ?? "Ahmedabad"}
                </div>

                <div className="mt-2 text-xs text-white/80">
                  Office Hours: 10:00 AM – 06:00 PM
                </div>
              </div>

              {/* Center */}
              <div className="flex justify-center gap-6">

                <div className="rounded-xl bg-white/10 px-6 py-4 text-center min-w-[140px]">
                  <div className="text-xs uppercase opacity-70">
                    Check In
                  </div>

                  <div className="mt-2 text-2xl font-bold">
                    {checkInTime}
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 px-6 py-4 text-center min-w-[140px]">
                  <div className="text-xs uppercase opacity-70">
                    Check Out
                  </div>

                  <div className="mt-2 text-2xl font-bold">
                    {checkOutTime}
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 px-6 py-4 text-center min-w-[160px]">
                  <div className="text-xs uppercase opacity-70">
                    Working Hours
                  </div>

                  <div className="mt-2 text-2xl font-bold">
                    {workingHours}
                  </div>
                </div>

              </div>

              {/* Right */}
              <div className="flex justify-end">

                {todayRow?.check_out ? (

                  <button
                    disabled
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/70 px-6 font-semibold text-primary cursor-not-allowed"
                  >
                    ✓ Day Completed
                  </button>

                ) : !checkedIn ? (

                  <button
                    onClick={() => checkIn.mutate()}
                    disabled={checkIn.isPending}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary shadow"
                  >
                    <Play className="h-4 w-4" />
                    {checkIn.isPending ? "Checking In..." : "Check In"}
                  </button>

                ) : (

                  <button
                    onClick={() => checkOut.mutate()}
                    disabled={checkOut.isPending}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary shadow"
                  >
                    <StopIcon className="h-4 w-4" />
                    {checkOut.isPending ? "Checking Out..." : "Check Out"}
                  </button>

                )}

              </div>

            </div>
          </div>
        ) : (

          <div className="grid grid-cols-2 gap-6">

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-xs text-muted-foreground">
                Present Today
              </div>

              <div className="mt-2 text-3xl font-semibold text-success">
                {todayStats.present}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="text-xs text-muted-foreground">
                Absent Today
              </div>

              <div className="mt-2 text-3xl font-semibold text-danger">
                {todayStats.absent}
              </div>
            </div>



          </div>

        )}

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="grid place-items-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : (
              <table className="w-full border-separate border-spacing-0 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 border-b border-border bg-surface px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</th>
                    {days.map((d) => (
                      <th key={d} className="border-b border-border px-1 py-3 text-center font-semibold tabular text-muted-foreground">{d}</th>
                    ))}
                    <th className="border-b border-border px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">P</th>
                    <th className="border-b border-border px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">A</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.length === 0 ? (
                    <tr><td colSpan={daysInMonth + 4} className="py-12 text-center text-muted-foreground">No attendance records yet — check in above to start.</td></tr>
                  ) : grouped.map(([uid, uRows]) => {
                    const p = {
                      full_name: uRows[0]?.employee_name ?? "User",
                      job_title: "",
                    };
                    const byDate = new Map(uRows.map((r) => [r.date, r]));
                    const p_ = uRows.filter(
                      (r) =>
                        r.status === "PRESENT"

                    ).length;



                    const a = uRows.filter(
                      (r) => r.status === "ABSENT"
                    ).length;
                    return (
                      <tr key={uid} className="hover:bg-accent/40">
                        <td className="sticky left-0 z-10 border-b border-border bg-surface px-4 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={p?.full_name ?? "User"} size="xs" />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">{p?.full_name ?? "User"}</div>
                              <div className="truncate text-[10px] text-muted-foreground">{p?.job_title ?? ""}</div>
                            </div>
                          </div>
                        </td>
                        {days.map((d) => {
                          const iso = `${monthStart.slice(0, 8)}${String(d).padStart(2, "0")}`;
                          const r = byDate.get(iso);

                          if (d === new Date().getDate()) {
                            console.log("Today's ISO:", iso);
                            console.log("Today's Row:", r);
                          }

                          const todayDay = new Date().getDate();

                          const isPastDay = d < todayDay;
                          const isToday = d === todayDay;

                          return (
                            <td
                              key={d}
                              className="border-b border-border px-1 py-2 text-center"
                            >
                              {r ? (
                                <span
                                  className={cn(
                                     "mx-auto flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-semibold",
                                    statusMap[r.status].className
                                  )}
                                >
                                  {short[r.status]}
                                </span>
                              ) : isPastDay ? (
                                <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-md bg-red-600 text-[9px] font-semibold text-white">
                                  A
                                </span>
                              ) : isToday ? (
                                <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-md bg-gray-300 text-[9px] font-semibold">
                                  ?
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">·</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="border-b border-border px-3 py-2 text-right tabular font-medium text-success">{p_}</td>
                        <td className="border-b border-border px-3 py-2 text-right tabular font-medium text-danger">{a}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
