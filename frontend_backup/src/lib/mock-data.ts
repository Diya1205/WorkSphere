export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "wfh";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type Role = "super_admin" | "hr" | "manager" | "employee";

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  designation: string;
  department: string;
  manager?: string;
  location: string;
  joinDate: string;
  status: "active" | "on_leave" | "notice";
  employmentType: "Full-time" | "Contract" | "Intern";
  ctc: number;
  avatarColor: string;
}

const colors = [
  "#2563EB", "#16A34A", "#D97706", "#DC2626", "#0891B2",
  "#7C3AED", "#DB2777", "#059669", "#EA580C", "#4338CA",
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const avatarColor = (name: string) => colors[hash(name) % colors.length];
export const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const rawEmployees: Omit<Employee, "avatarColor">[] = [
  { id: "e1", code: "IT-1042", name: "Ananya Sharma", email: "ananya.sharma@northwind.io", phone: "+91 98450 12034", role: "super_admin", designation: "VP, Engineering", department: "Engineering", location: "Bengaluru", joinDate: "2018-04-02", status: "active", employmentType: "Full-time", ctc: 6800000 },
  { id: "e2", code: "IT-1103", name: "Rahul Verma", email: "rahul.verma@northwind.io", phone: "+91 99872 55014", role: "hr", designation: "Head of People Ops", department: "Human Resources", location: "Bengaluru", joinDate: "2019-08-14", status: "active", employmentType: "Full-time", ctc: 4200000 },
  { id: "e3", code: "IT-1214", name: "Priya Nair", email: "priya.nair@northwind.io", phone: "+91 90031 22110", role: "manager", designation: "Engineering Manager", department: "Engineering", manager: "Ananya Sharma", location: "Bengaluru", joinDate: "2020-01-20", status: "active", employmentType: "Full-time", ctc: 3600000 },
  { id: "e4", code: "IT-1287", name: "Vikram Reddy", email: "vikram.reddy@northwind.io", phone: "+91 88450 90210", role: "employee", designation: "Senior Software Engineer", department: "Engineering", manager: "Priya Nair", location: "Hyderabad", joinDate: "2021-03-15", status: "active", employmentType: "Full-time", ctc: 2400000 },
  { id: "e5", code: "IT-1301", name: "Sneha Iyer", email: "sneha.iyer@northwind.io", phone: "+91 99000 11223", role: "employee", designation: "Product Designer", department: "Design", manager: "Marcus Chen", location: "Bengaluru", joinDate: "2021-11-08", status: "active", employmentType: "Full-time", ctc: 1950000 },
  { id: "e6", code: "IT-1355", name: "Marcus Chen", email: "marcus.chen@northwind.io", phone: "+1 415 220 8890", role: "manager", designation: "Design Lead", department: "Design", location: "San Francisco", joinDate: "2019-06-11", status: "active", employmentType: "Full-time", ctc: 5200000 },
  { id: "e7", code: "IT-1402", name: "Aditi Kapoor", email: "aditi.kapoor@northwind.io", phone: "+91 98204 33110", role: "employee", designation: "QA Engineer", department: "QA", manager: "Priya Nair", location: "Pune", joinDate: "2022-02-01", status: "active", employmentType: "Full-time", ctc: 1450000 },
  { id: "e8", code: "IT-1418", name: "Karthik Rao", email: "karthik.rao@northwind.io", phone: "+91 90080 77621", role: "employee", designation: "DevOps Engineer", department: "DevOps", manager: "Priya Nair", location: "Bengaluru", joinDate: "2020-09-22", status: "active", employmentType: "Full-time", ctc: 2850000 },
  { id: "e9", code: "IT-1502", name: "Isabelle Laurent", email: "isabelle.laurent@northwind.io", phone: "+33 6 22 45 90 11", role: "employee", designation: "Account Executive", department: "Sales", location: "Paris", joinDate: "2022-05-18", status: "active", employmentType: "Full-time", ctc: 3100000 },
  { id: "e10", code: "IT-1533", name: "Meera Joshi", email: "meera.joshi@northwind.io", phone: "+91 98110 88445", role: "employee", designation: "Finance Analyst", department: "Finance", location: "Mumbai", joinDate: "2023-01-09", status: "on_leave", employmentType: "Full-time", ctc: 1800000 },
  { id: "e11", code: "IT-1587", name: "David Okafor", email: "david.okafor@northwind.io", phone: "+44 7700 900901", role: "employee", designation: "Backend Engineer", department: "Engineering", manager: "Priya Nair", location: "London", joinDate: "2022-08-30", status: "active", employmentType: "Full-time", ctc: 4400000 },
  { id: "e12", code: "IT-1601", name: "Riya Menon", email: "riya.menon@northwind.io", phone: "+91 88822 55411", role: "employee", designation: "Recruiter", department: "Human Resources", manager: "Rahul Verma", location: "Bengaluru", joinDate: "2023-06-14", status: "active", employmentType: "Full-time", ctc: 1250000 },
  { id: "e13", code: "IT-1644", name: "Arjun Malhotra", email: "arjun.malhotra@northwind.io", phone: "+91 99999 12340", role: "employee", designation: "Frontend Engineer", department: "Engineering", manager: "Priya Nair", location: "Bengaluru", joinDate: "2023-09-04", status: "active", employmentType: "Full-time", ctc: 1700000 },
  { id: "e14", code: "IT-1691", name: "Zara Ahmed", email: "zara.ahmed@northwind.io", phone: "+971 50 220 4411", role: "employee", designation: "Solutions Architect", department: "Engineering", manager: "Ananya Sharma", location: "Dubai", joinDate: "2021-07-19", status: "active", employmentType: "Full-time", ctc: 5900000 },
  { id: "e15", code: "IT-1720", name: "Rohan Bhat", email: "rohan.bhat@northwind.io", phone: "+91 90340 66201", role: "employee", designation: "Data Engineer", department: "Engineering", manager: "Priya Nair", location: "Bengaluru", joinDate: "2024-02-12", status: "active", employmentType: "Full-time", ctc: 1600000 },
  { id: "e16", code: "IT-1755", name: "Elena Rodríguez", email: "elena.rodriguez@northwind.io", phone: "+34 612 004 118", role: "employee", designation: "Marketing Manager", department: "Marketing", location: "Madrid", joinDate: "2022-11-01", status: "active", employmentType: "Full-time", ctc: 2900000 },
  { id: "e17", code: "IT-1802", name: "Tanvi Deshmukh", email: "tanvi.deshmukh@northwind.io", phone: "+91 98222 15577", role: "employee", designation: "SDET Intern", department: "QA", manager: "Aditi Kapoor", location: "Pune", joinDate: "2025-01-15", status: "active", employmentType: "Intern", ctc: 480000 },
  { id: "e18", code: "IT-1811", name: "Yuki Tanaka", email: "yuki.tanaka@northwind.io", phone: "+81 90 1234 5678", role: "employee", designation: "Mobile Engineer", department: "Engineering", manager: "Zara Ahmed", location: "Tokyo", joinDate: "2023-04-22", status: "active", employmentType: "Full-time", ctc: 4100000 },
];

export const employees: Employee[] = rawEmployees.map((e) => ({
  ...e,
  avatarColor: avatarColor(e.name),
}));

export const departments = [
  { name: "Engineering", head: "Ananya Sharma", headcount: 8, budget: 24500000, color: "#2563EB" },
  { name: "Design", head: "Marcus Chen", headcount: 2, budget: 7150000, color: "#7C3AED" },
  { name: "QA", head: "Priya Nair", headcount: 2, budget: 1930000, color: "#0891B2" },
  { name: "DevOps", head: "Karthik Rao", headcount: 1, budget: 2850000, color: "#059669" },
  { name: "Sales", head: "Isabelle Laurent", headcount: 1, budget: 3100000, color: "#D97706" },
  { name: "Human Resources", head: "Rahul Verma", headcount: 2, budget: 5450000, color: "#DB2777" },
  { name: "Finance", head: "Meera Joshi", headcount: 1, budget: 1800000, color: "#4338CA" },
  { name: "Marketing", head: "Elena Rodríguez", headcount: 1, budget: 2900000, color: "#EA580C" },
];

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "Casual" | "Sick" | "Earned" | "Comp-off" | "Unpaid";
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approver?: string;
  approverComment?: string;
}

export const leaveRequests: LeaveRequest[] = [
  { id: "l1", employeeId: "e4", type: "Earned", from: "2026-07-08", to: "2026-07-11", days: 4, reason: "Family wedding in Hyderabad — travel Mon–Thu.", status: "pending", appliedOn: "2026-07-01", approver: "Priya Nair" },
  { id: "l2", employeeId: "e7", type: "Sick", from: "2026-07-03", to: "2026-07-03", days: 1, reason: "Doctor's appointment — viral fever.", status: "pending", appliedOn: "2026-07-02", approver: "Priya Nair" },
  { id: "l3", employeeId: "e13", type: "Casual", from: "2026-07-14", to: "2026-07-15", days: 2, reason: "Personal errand.", status: "pending", appliedOn: "2026-06-30", approver: "Priya Nair" },
  { id: "l4", employeeId: "e5", type: "Earned", from: "2026-06-24", to: "2026-06-28", days: 5, reason: "Kerala trip — booked 2 months in advance.", status: "approved", appliedOn: "2026-05-20", approver: "Marcus Chen", approverComment: "Enjoy! Handover to Riya." },
  { id: "l5", employeeId: "e10", type: "Sick", from: "2026-06-29", to: "2026-07-05", days: 7, reason: "Post-operative recovery.", status: "approved", appliedOn: "2026-06-27", approver: "Rahul Verma", approverComment: "Take care. Full recovery first." },
  { id: "l6", employeeId: "e15", type: "Casual", from: "2026-06-18", to: "2026-06-18", days: 1, reason: "Passport renewal.", status: "approved", appliedOn: "2026-06-12", approver: "Priya Nair" },
  { id: "l7", employeeId: "e8", type: "Comp-off", from: "2026-06-15", to: "2026-06-15", days: 1, reason: "Comp-off against weekend production release.", status: "approved", appliedOn: "2026-06-10", approver: "Priya Nair" },
  { id: "l8", employeeId: "e17", type: "Casual", from: "2026-06-22", to: "2026-06-22", days: 1, reason: "College convocation.", status: "rejected", appliedOn: "2026-06-05", approver: "Aditi Kapoor", approverComment: "Clashes with release week — please reschedule." },
];

export const leaveBalances: Record<string, { casual: number; sick: number; earned: number; total: number; used: number }> = {
  e4: { casual: 6, sick: 10, earned: 14, total: 30, used: 6 },
  e5: { casual: 4, sick: 12, earned: 9, total: 30, used: 11 },
  e7: { casual: 7, sick: 8, earned: 15, total: 30, used: 4 },
  e13: { casual: 8, sick: 12, earned: 12, total: 30, used: 2 },
};

export const attendanceToday = {
  present: 412,
  late: 38,
  absent: 21,
  wfh: 96,
  onLeave: 33,
  total: 500,
};

export const kpiTrends = {
  totalEmployees: { value: 512, delta: +2.4, series: [488, 492, 497, 501, 505, 508, 512] },
  presentToday: { value: 412, delta: +1.1, series: [398, 402, 405, 408, 410, 411, 412] },
  onLeave: { value: 33, delta: -8.3, series: [40, 38, 37, 36, 35, 34, 33] },
  openPositions: { value: 24, delta: +14.3, series: [18, 19, 20, 21, 22, 23, 24] },
  payrollCost: { value: 148500000, delta: +3.2, series: [140, 141, 143, 144, 146, 147, 148.5] },
  attrition: { value: 6.8, delta: -0.4, series: [7.4, 7.3, 7.1, 7.0, 6.9, 6.9, 6.8] },
};

export const attendance30Days = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 460 - Math.round(Math.sin(i / 3) * 12);
  const dow = (i + 5) % 7;
  const weekend = dow === 0 || dow === 6;
  return {
    day: `Jun ${day}`,
    present: weekend ? 45 : base + Math.round(Math.random() * 8),
    late: weekend ? 3 : 20 + Math.round(Math.random() * 20),
    absent: weekend ? 2 : 8 + Math.round(Math.random() * 12),
  };
});

export const growthYoY = [
  { month: "Jan", employees: 442, hires: 12, exits: 4 },
  { month: "Feb", employees: 448, hires: 10, exits: 4 },
  { month: "Mar", employees: 456, hires: 14, exits: 6 },
  { month: "Apr", employees: 468, hires: 18, exits: 6 },
  { month: "May", employees: 479, hires: 15, exits: 4 },
  { month: "Jun", employees: 490, hires: 16, exits: 5 },
  { month: "Jul", employees: 512, hires: 26, exits: 4 },
];

export const taskCompletion = [
  { week: "W22", done: 42, inProgress: 18, blocked: 4 },
  { week: "W23", done: 51, inProgress: 22, blocked: 3 },
  { week: "W24", done: 47, inProgress: 20, blocked: 6 },
  { week: "W25", done: 58, inProgress: 24, blocked: 2 },
  { week: "W26", done: 64, inProgress: 19, blocked: 3 },
  { week: "W27", done: 71, inProgress: 22, blocked: 5 },
];

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  due: string;
  subtasks: { done: number; total: number };
  comments: number;
}

export const tasks: Task[] = [
  { id: "t1", title: "Payroll module: split CTC breakdown into reusable component", assigneeId: "e13", status: "in_progress", priority: "high", project: "HRMS v3", due: "2026-07-08", subtasks: { done: 3, total: 5 }, comments: 4 },
  { id: "t2", title: "Fix flaky attendance sync retry (biometric device #17)", assigneeId: "e8", status: "in_progress", priority: "urgent", project: "Platform", due: "2026-07-04", subtasks: { done: 1, total: 3 }, comments: 7 },
  { id: "t3", title: "Design review — leave calendar overlap indicator", assigneeId: "e5", status: "review", priority: "medium", project: "HRMS v3", due: "2026-07-06", subtasks: { done: 2, total: 2 }, comments: 3 },
  { id: "t4", title: "Draft Q3 OKRs for Engineering", assigneeId: "e3", status: "todo", priority: "high", project: "OKR Cycle", due: "2026-07-12", subtasks: { done: 0, total: 4 }, comments: 1 },
  { id: "t5", title: "Vendor security review — payroll bank API", assigneeId: "e14", status: "review", priority: "urgent", project: "Compliance", due: "2026-07-05", subtasks: { done: 4, total: 4 }, comments: 9 },
  { id: "t6", title: "Migrate reports export from CSV to XLSX with formatting", assigneeId: "e11", status: "todo", priority: "medium", project: "Reports", due: "2026-07-18", subtasks: { done: 0, total: 6 }, comments: 0 },
  { id: "t7", title: "Onboarding wizard: bank details step validation", assigneeId: "e4", status: "in_progress", priority: "high", project: "HRMS v3", due: "2026-07-09", subtasks: { done: 2, total: 4 }, comments: 2 },
  { id: "t8", title: "Ship dark mode audit for reports module", assigneeId: "e5", status: "backlog", priority: "low", project: "HRMS v3", due: "2026-07-25", subtasks: { done: 0, total: 3 }, comments: 0 },
  { id: "t9", title: "Publish June payroll run — 512 employees", assigneeId: "e2", status: "done", priority: "urgent", project: "Payroll", due: "2026-06-28", subtasks: { done: 5, total: 5 }, comments: 6 },
  { id: "t10", title: "Interview kit for Staff Backend Engineer role", assigneeId: "e12", status: "done", priority: "medium", project: "Recruitment", due: "2026-06-30", subtasks: { done: 3, total: 3 }, comments: 4 },
  { id: "t11", title: "Fix layout bug on mobile leave apply modal", assigneeId: "e13", status: "backlog", priority: "medium", project: "HRMS v3", due: "2026-07-22", subtasks: { done: 0, total: 2 }, comments: 1 },
  { id: "t12", title: "Reconcile PF challans for June 2026", assigneeId: "e10", status: "todo", priority: "high", project: "Payroll", due: "2026-07-10", subtasks: { done: 0, total: 3 }, comments: 0 },
];

export interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired";
  source: string;
  yoe: number;
  location: string;
  rating: number;
  appliedOn: string;
}

export const candidates: Candidate[] = [
  { id: "c1", name: "Nikhil Bansal", role: "Staff Backend Engineer", stage: "applied", source: "LinkedIn", yoe: 8, location: "Bengaluru", rating: 0, appliedOn: "2026-06-30" },
  { id: "c2", name: "Sara Kim", role: "Staff Backend Engineer", stage: "applied", source: "Referral", yoe: 9, location: "Seoul", rating: 0, appliedOn: "2026-06-29" },
  { id: "c3", name: "Amit Sinha", role: "Senior Frontend Engineer", stage: "screening", source: "Careers Page", yoe: 6, location: "Bengaluru", rating: 3, appliedOn: "2026-06-24" },
  { id: "c4", name: "Léa Dubois", role: "Product Designer", stage: "screening", source: "Dribbble", yoe: 5, location: "Paris", rating: 4, appliedOn: "2026-06-22" },
  { id: "c5", name: "Ravi Krishnan", role: "Staff Backend Engineer", stage: "interview", source: "Referral", yoe: 10, location: "Chennai", rating: 4, appliedOn: "2026-06-15" },
  { id: "c6", name: "Grace Wong", role: "Engineering Manager", stage: "interview", source: "LinkedIn", yoe: 12, location: "Singapore", rating: 5, appliedOn: "2026-06-10" },
  { id: "c7", name: "Fatima Al-Sayed", role: "Senior Data Engineer", stage: "offer", source: "Referral", yoe: 7, location: "Dubai", rating: 5, appliedOn: "2026-05-28" },
  { id: "c8", name: "Ben Carter", role: "DevOps Engineer", stage: "hired", source: "Careers Page", yoe: 5, location: "London", rating: 4, appliedOn: "2026-05-02" },
];

export const announcements = [
  { id: "a1", title: "Q3 town hall — Friday 4:00 PM IST", body: "All-hands with the exec team. Submit questions via #town-hall.", author: "Ananya Sharma", date: "2026-07-02", tag: "Company" },
  { id: "a2", title: "New wellness benefit: annual health check-up", body: "Rolled out for all full-time employees from July 15. Details in Benefits portal.", author: "Rahul Verma", date: "2026-07-01", tag: "Benefits" },
  { id: "a3", title: "Bengaluru office — parking policy update", body: "Reserved slots move to first-come basis from Monday. Bike parking unchanged.", author: "Facilities", date: "2026-06-29", tag: "Ops" },
];

export const upcomingEvents = [
  { id: "ev1", name: "Sneha Iyer — Birthday", date: "2026-07-04", type: "birthday" as const },
  { id: "ev2", name: "Karthik Rao — 6th anniversary", date: "2026-07-05", type: "anniversary" as const },
  { id: "ev3", name: "Product review — HRMS v3", date: "2026-07-07", type: "meeting" as const },
  { id: "ev4", name: "Payroll cut-off", date: "2026-07-10", type: "deadline" as const },
  { id: "ev5", name: "Arjun Malhotra — Birthday", date: "2026-07-11", type: "birthday" as const },
];

export const activityFeed = [
  { id: "af1", who: "Priya Nair", action: "approved leave request", target: "Sneha Iyer — 5 days Earned", when: "12 min ago" },
  { id: "af2", who: "System", action: "processed payroll run", target: "June 2026 · 512 employees · ₹14.85 Cr", when: "1 hr ago" },
  { id: "af3", who: "Rahul Verma", action: "posted announcement", target: "New wellness benefit", when: "3 hr ago" },
  { id: "af4", who: "Riya Menon", action: "moved candidate to Interview", target: "Ravi Krishnan — Staff Backend", when: "5 hr ago" },
  { id: "af5", who: "Karthik Rao", action: "resolved incident", target: "Attendance sync — device #17", when: "Yesterday" },
  { id: "af6", who: "Ananya Sharma", action: "updated role permissions", target: "Manager · Payroll view", when: "Yesterday" },
];

export const currency = (n: number, ccy = "INR") =>
  new Intl.NumberFormat(ccy === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: 0,
  }).format(n);

export const compactCurrency = (n: number) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return `₹${n}`;
};

export const findEmployee = (id: string) => employees.find((e) => e.id === id);
