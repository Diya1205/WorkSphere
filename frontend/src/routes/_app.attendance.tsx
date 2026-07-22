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
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
export const Route = createFileRoute("/_app/attendance")({
  component: AttendancePage,
  head: () => ({ meta: [{ title: "Attendance · TirthInfotech" }] }),
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
async function getCurrentPosition() {
  console.log("Capacitor platform:", Capacitor.getPlatform());
  console.log("Is Native:", Capacitor.isNativePlatform());
  if (Capacitor.isNativePlatform()) {

    const permission = await Geolocation.requestPermissions();

    if (permission.location !== "granted") {
      throw new Error("Location permission denied.");
    }

    return await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });

  }

  return new Promise<GeolocationPosition>((resolve, reject) => {

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );

  });
}

async function getGpsCoords(): Promise<{
  latitude: number;
  longitude: number;
}> {
  try {
    const position = await getCurrentPosition();

    console.log("Latitude:", position.coords.latitude);
    console.log("Longitude:", position.coords.longitude);

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.error("GPS ERROR:", error);

    throw error;
  }
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
      const { latitude, longitude } = await getGpsCoords();
      await api.post("/attendance/", { latitude, longitude });
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["attendance"] });
      toast.success("Checked In");
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.detail;
      toast.error(backendMessage || error.message || "Check-in failed.");
    },
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      const { latitude, longitude } = await getGpsCoords();
      await api.post("/attendance/", { latitude, longitude });
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["attendance"] });
      toast.success("Checked Out");
    },
    onError: (error: any) => {
      const backendMessage = error.response?.data?.detail;
      toast.error(backendMessage || error.message || "Check-out failed.");
    },
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

      <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">

        {isEmployee ? (

          <div className="rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-5 text-white shadow-xl sm:rounded-3xl sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[320px_1fr_220px] lg:items-center lg:gap-10">

              {/* Left */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-white/80">
                  Today · {today}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="text-3xl font-bold tabular sm:text-4xl lg:text-5xl">
                    {checkInTime}
                  </div>

                  <div
                    className={cn(
                      "inline-flex h-8 items-center rounded-full px-4 text-xs font-semibold shadow-sm sm:h-9 sm:px-5 sm:text-sm",
                      attendanceStatus === "PRESENT"
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    )}
                  >
                    {attendanceStatus === "PRESENT" ? "Present" : "Absent"}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {todayRow?.location ?? "Ahmedabad"}
                </div>

                <div className="mt-2 text-xs text-white/80">
                  Office Hours: 10:00 AM – 06:00 PM
                </div>
              </div>

              {/* Center */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:flex lg:justify-center lg:gap-6">

                <div className="rounded-xl bg-white/10 px-2 py-3 text-center sm:px-4 sm:py-4 lg:min-w-[140px] lg:px-6">
                  <div className="text-[10px] uppercase opacity-70 sm:text-xs">
                    Check In
                  </div>

                  <div className="mt-1 text-base font-bold sm:mt-2 sm:text-xl lg:text-2xl">
                    {checkInTime}
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 px-2 py-3 text-center sm:px-4 sm:py-4 lg:min-w-[140px] lg:px-6">
                  <div className="text-[10px] uppercase opacity-70 sm:text-xs">
                    Check Out
                  </div>

                  <div className="mt-1 text-base font-bold sm:mt-2 sm:text-xl lg:text-2xl">
                    {checkOutTime}
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 px-2 py-3 text-center sm:px-4 sm:py-4 lg:min-w-[160px] lg:px-6">
                  <div className="text-[10px] uppercase opacity-70 sm:text-xs">
                    Working Hours
                  </div>

                  <div className="mt-1 text-base font-bold sm:mt-2 sm:text-xl lg:text-2xl">
                    {workingHours}
                  </div>
                </div>

              </div>

              {/* Right */}
              <div className="flex justify-stretch lg:justify-end">

                {todayRow?.check_out ? (

                  <button
                    disabled
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-6 font-semibold text-primary cursor-not-allowed sm:h-12 lg:w-auto"
                  >
                    ✓ Day Completed
                  </button>

                ) : !checkedIn ? (

                  <button
                    onClick={() => checkIn.mutate()}
                    disabled={checkIn.isPending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary shadow sm:h-12 lg:w-auto"
                  >
                    <Play className="h-4 w-4" />
                    {checkIn.isPending ? "Checking In..." : "Check In"}
                  </button>

                ) : (

                  <button
                    onClick={() => checkOut.mutate()}
                    disabled={checkOut.isPending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary shadow sm:h-12 lg:w-auto"
                  >
                    <StopIcon className="h-4 w-4" />
                    {checkOut.isPending ? "Checking Out..." : "Check Out"}
                  </button>

                )}

              </div>

            </div>
          </div>
        ) : (

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">

            <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="text-xs text-muted-foreground">
                Present Today
              </div>

              <div className="mt-2 text-2xl font-semibold text-success sm:text-3xl">
                {todayStats.present}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="text-xs text-muted-foreground">
                Absent Today
              </div>

              <div className="mt-2 text-2xl font-semibold text-danger sm:text-3xl">
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
                    <th className="sticky left-0 z-10 whitespace-nowrap border-b border-border bg-surface px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-4">Employee</th>
                    {days.map((d) => (
                      <th key={d} className="border-b border-border px-1 py-3 text-center font-semibold tabular text-muted-foreground">{d}</th>
                    ))}
                    <th className="whitespace-nowrap border-b border-border px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">P</th>
                    <th className="whitespace-nowrap border-b border-border px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">A</th>
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
                        <td className="sticky left-0 z-10 border-b border-border bg-surface px-3 py-2 sm:px-4">
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