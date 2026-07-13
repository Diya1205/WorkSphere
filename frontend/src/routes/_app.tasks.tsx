import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Camera,
  Trash2,
  KeyRound,
  Mail,
  Phone,
  Users2,
  CalendarDays,
  Briefcase,
  Building2,
  IdCard,
  ShieldCheck,
  MapPin,
  Clock3,
  FileText,
  ListChecks,
  Activity,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { cn } from "@/lib/utils";

/**
 * UI / UX ONLY.
 *
 * This page does not call any API, does not validate input, and does not
 * contain business logic. All state below is local component state used
 * purely to make the inputs interactive for design review.
 *
 * Wiring notes for whoever connects this later:
 *  - Field set intentionally matches the existing Employee Add/Edit form.
 *  - "Personal / Address" fields   -> reuse the employee update endpoint.
 *  - "Employment Information" card -> read-only, admin-managed data only.
 *  - "Security" card               -> separate change-password endpoint,
 *    must NOT be submitted together with the profile form.
 */

export const Route = createFileRoute("/_app/tasks")({
  component: MyProfilePage,
  head: () => ({ meta: [{ title: "My Profile · Northwind IT" }] }),
});

/* -------------------------------------------------------------------------- */
/*  Placeholder data — replace with the authenticated employee record         */
/* -------------------------------------------------------------------------- */

const MOCK_EMPLOYEE = {
  first_name: "Aarav",
  last_name: "Shah",
  email: "aarav.shah@northwindit.com",
  phone: "+91 98765 43210",
  emergency_contact: "+91 91234 56789",
  gender: "Male",
  marital_status: "Single",
  date_of_birth: "1996-04-12",

  employee_code: "EMP-0142",
  department: "Engineering",
  designation: "Senior Software Engineer",
  role: "Employee",
  employment_status: "Active",
  joining_date: "2022-01-10",
  annual_ctc: "₹18,50,000",

  address: "402, Willowbrook Residency",
  city: "Ahmedabad",
  state: "Gujarat",
  country: "India",
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function MyProfilePage() {
  // Editable profile fields (mirrors the Employee Add/Edit form's field set)
  const [form, setForm] = useState({
    first_name: MOCK_EMPLOYEE.first_name,
    last_name: MOCK_EMPLOYEE.last_name,
    phone: MOCK_EMPLOYEE.phone,
    emergency_contact: MOCK_EMPLOYEE.emergency_contact,
    gender: MOCK_EMPLOYEE.gender,
    marital_status: MOCK_EMPLOYEE.marital_status,
    address: MOCK_EMPLOYEE.address,
    city: MOCK_EMPLOYEE.city,
    state: MOCK_EMPLOYEE.state,
    country: MOCK_EMPLOYEE.country,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const updatePassword =
    (key: keyof typeof passwordForm) => (e: React.ChangeEvent<any>) =>
      setPasswordForm((prev) => ({ ...prev, [key]: e.target.value }));

  const fullName = `${form.first_name} ${form.last_name}`.trim();

  return (
    <>
      <PageHeader
        title="My Profile"
        description="View and manage your personal information"
        breadcrumbs={[{ label: "Home" }, { label: "My Profile" }]}
      />

      <div className="mx-auto max-w-[1200px] space-y-6 px-6 py-6 lg:px-8">
        {/* ---------------------------------------------------------------- */}
        {/* Profile header                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-resting)]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-3">
              <Avatar name={fullName} size="xl" />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-accent"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
                <span className="inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                  {MOCK_EMPLOYEE.employment_status}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IdCard className="h-3.5 w-3.5" />
                  {MOCK_EMPLOYEE.employee_code}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {MOCK_EMPLOYEE.designation}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {MOCK_EMPLOYEE.department}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(MOCK_EMPLOYEE.joining_date)}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Personal + Employment                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card icon={Users2} title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name">
                <input
                  value={form.first_name}
                  onChange={update("first_name")}
                  className="input"
                />
              </Field>
              <Field label="Last Name">
                <input
                  value={form.last_name}
                  onChange={update("last_name")}
                  className="input"
                />
              </Field>

              <Field label="Email">
                <div className="input flex items-center gap-2 bg-muted text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{MOCK_EMPLOYEE.email}</span>
                </div>
              </Field>
              <Field label="Phone Number">
                <input value={form.phone} onChange={update("phone")} className="input" />
              </Field>

              <Field label="Parent / Emergency Contact">
                <input
                  value={form.emergency_contact}
                  onChange={update("emergency_contact")}
                  className="input"
                />
              </Field>
              <Field label="Date of Birth">
                <div className="input flex items-center gap-2 bg-muted text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(MOCK_EMPLOYEE.date_of_birth)}
                </div>
              </Field>

              <Field label="Gender">
                <select value={form.gender} onChange={update("gender")} className="input">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Marital Status">
                <select
                  value={form.marital_status}
                  onChange={update("marital_status")}
                  className="input"
                >
                  <option>Single</option>
                  <option>Married</option>
                  <option>Other</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card
            icon={Briefcase}
            title="Employment Information"
            badge="Read only"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Employee Code" value={MOCK_EMPLOYEE.employee_code} />
              <ReadOnlyField label="Department" value={MOCK_EMPLOYEE.department} />
              <ReadOnlyField label="Designation" value={MOCK_EMPLOYEE.designation} />
              <ReadOnlyField label="Role" value={MOCK_EMPLOYEE.role} />
              <ReadOnlyField
                label="Employment Status"
                value={MOCK_EMPLOYEE.employment_status}
              />
              <ReadOnlyField
                label="Joining Date"
                value={formatDate(MOCK_EMPLOYEE.joining_date)}
              />
              <ReadOnlyField label="Annual CTC" value={MOCK_EMPLOYEE.annual_ctc} />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              These details are managed by HR. Contact your admin to request changes.
            </p>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Address + Security                                               */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card icon={MapPin} title="Address Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Address" className="sm:col-span-2">
                <input
                  value={form.address}
                  onChange={update("address")}
                  className="input"
                />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={update("city")} className="input" />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={update("state")} className="input" />
              </Field>
              <Field label="Country" className="sm:col-span-2">
                <input
                  value={form.country}
                  onChange={update("country")}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <Card icon={ShieldCheck} title="Security">
            <div className="space-y-4">
              <Field label="Current Password">
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={updatePassword("current_password")}
                  placeholder="••••••••"
                  className="input"
                />
              </Field>
              <Field label="New Password">
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={updatePassword("new_password")}
                  placeholder="••••••••"
                  className="input"
                />
              </Field>
              <Field label="Confirm New Password">
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={updatePassword("confirm_password")}
                  placeholder="••••••••"
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom actions (profile form only — independent of Security)     */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex justify-end gap-2 rounded-xl border border-border bg-surface px-6 py-4 shadow-[var(--shadow-resting)]">
          <button
            type="button"
            className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-dark"
          >
            Save Changes
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Future-ready sections — spacing reserved only, not implemented   */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ComingSoonCard icon={Activity} title="Recent Activity" />
          <ComingSoonCard icon={Clock3} title="Login History" />
          <ComingSoonCard icon={FileText} title="Documents" />
          <ComingSoonCard icon={CalendarDays} title="Attendance Summary" />
          <ComingSoonCard icon={ListChecks} title="Assigned Tasks" />
        </div>
      </div>

      <style>{`
        .input{min-height:2.25rem;width:100%;border:1px solid hsl(var(--border));border-radius:.375rem;background:hsl(var(--background));padding:0 .75rem;font-size:.875rem;outline:none}
        .input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/.15)}
      `}</style>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                          */
/* -------------------------------------------------------------------------- */

function Card({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-resting)]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="input flex cursor-not-allowed items-center bg-muted text-muted-foreground">
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function ComingSoonCard({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex min-h-[120px] flex-col items-start justify-between rounded-xl border border-dashed border-border bg-background/60 p-5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">Coming soon</div>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}