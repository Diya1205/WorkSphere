import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Trash2,
  KeyRound,
  Mail,
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
  Loader2,
  Users2,
} from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { Avatar } from "@/components/hrms/Avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getProfile, updateProfile, type ProfileData } from "@/services/profile";

export const Route = createFileRoute("/_app/profile")({
  component: MyProfilePage,
  head: () => ({ meta: [{ title: "My Profile · TirthInfotech" }] }),
});

const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  RESIGNED: "Resigned",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

type EditableForm = {
  phone: string;
  emergency_contact: string;
  marital_status: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

function emptyFormFrom(profile: ProfileData): EditableForm {
  return {
    phone: profile.phone ?? "",
    emergency_contact: profile.emergency_contact ?? "",
    marital_status: profile.marital_status ?? "SINGLE",
    address: profile.address ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    country: profile.country ?? "",
  };
}

function MyProfilePage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const [form, setForm] = useState<EditableForm>({
    phone: "",
    emergency_contact: "",
    marital_status: "SINGLE",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Keep local form in sync whenever fresh profile data lands
  useEffect(() => {
    if (profile) setForm(emptyFormFrom(profile));
  }, [profile]);

  // Clean up the object URL used for the local preview
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const update = (key: keyof EditableForm) => (e: React.ChangeEvent<any>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (photoFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([key, value]) => fd.append(key, value));
        fd.append("profile_photo", photoFile);
        return updateProfile(fd);
      }
      return updateProfile(form);
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["profile"] });
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success("Profile updated");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Could not update profile"
      );
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: async () => updateProfile({ profile_photo: null }),
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["profile"] });
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success("Photo removed");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data
          ? JSON.stringify(error.response.data)
          : "Could not remove photo"
      );
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    if (profile) setForm(emptyFormFrom(profile));
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  if (isLoading || !profile) {
    return (
      <>
        <PageHeader
          title="My Profile"
          description="View and manage your personal information"
          breadcrumbs={[{ label: "Home" }, { label: "My Profile" }]}
        />
        <div className="mx-auto grid max-w-[1200px] place-items-center px-6 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </>
    );
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const avatarSrc = photoPreview ?? profile.profile_photo ?? null;

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
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={fullName}
                  className="h-20 w-20 rounded-full border border-border object-cover"
                />
              ) : (
                <Avatar name={fullName} size="xl" />
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-foreground transition hover:bg-accent"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => removePhotoMutation.mutate()}
                  disabled={
                    removePhotoMutation.isPending ||
                    (!profile.profile_photo && !photoPreview)
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
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
                  {STATUS_LABELS[profile.status] ?? profile.status}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IdCard className="h-3.5 w-3.5" />
                  {profile.employee_code}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {profile.designation_name}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.department_name}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Joined {formatDate(profile.joining_date)}
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
              <ReadOnlyField label="First Name" value={profile.first_name} />
              <ReadOnlyField label="Last Name" value={profile.last_name} />

              <Field label="Email">
                <div className="input flex items-center gap-2 bg-muted text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile.email}</span>
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
              <ReadOnlyField
                label="Date of Birth"
                value={formatDate(profile.date_of_birth)}
                icon={CalendarDays}
              />

              <ReadOnlyField
                label="Gender"
                value={profile.gender ? GENDER_LABELS[profile.gender] ?? profile.gender : "—"}
              />
              <Field label="Marital Status">
                <select
                  value={form.marital_status}
                  onChange={update("marital_status")}
                  className="input"
                >
                  {MARITAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card icon={Briefcase} title="Employment Information" badge="Read only">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Employee Code" value={profile.employee_code} />
              <ReadOnlyField label="Department" value={profile.department_name} />
              <ReadOnlyField label="Designation" value={profile.designation_name} />
              <ReadOnlyField label="Role" value={ROLE_LABELS[profile.role] ?? profile.role} />
              <ReadOnlyField
                label="Employment Status"
                value={STATUS_LABELS[profile.status] ?? profile.status}
              />
              <ReadOnlyField label="Joining Date" value={formatDate(profile.joining_date)} />
              <ReadOnlyField label="Annual CTC" value={formatCTC(profile.annual_ctc)} />
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
                <input value={form.address} onChange={update("address")} className="input" />
              </Field>
              <Field label="City">
                <input value={form.city} onChange={update("city")} className="input" />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={update("state")} className="input" />
              </Field>
              <Field label="Country" className="sm:col-span-2">
                <input value={form.country} onChange={update("country")} className="input" />
              </Field>
            </div>
          </Card>

          <Card icon={ShieldCheck} title="Security">
            <div className="space-y-4">
              <Field label="Current Password">
                <input type="password" placeholder="••••••••" className="input" disabled />
              </Field>
              <Field label="New Password">
                <input type="password" placeholder="••••••••" className="input" disabled />
              </Field>
              <Field label="Confirm New Password">
                <input type="password" placeholder="••••••••" className="input" disabled />
              </Field>
            </div>

            <div className="mt-5 flex justify-end border-t border-border pt-4">
              <button
                type="button"
                disabled
                title="Password change isn't wired to a backend endpoint yet"
                className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground opacity-50 transition"
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom actions                                                   */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex justify-end gap-2 rounded-xl border border-border bg-surface px-6 py-4 shadow-[var(--shadow-resting)]">
          <button
            type="button"
            onClick={handleCancel}
            className="h-9 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60"
          >
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Future-ready sections                                            */}
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
        .input:disabled{opacity:.6;cursor:not-allowed}
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

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="input flex cursor-not-allowed items-center gap-2 bg-muted text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
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

function formatCTC(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
