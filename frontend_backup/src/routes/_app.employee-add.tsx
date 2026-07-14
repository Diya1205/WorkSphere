import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, Camera, X } from "lucide-react";
import { PageHeader } from "@/components/hrms/PageHeader";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { createEmployee } from "@/services/employeeService";

export const Route = createFileRoute("/_app/employee-add")({
    component: AddEmployeePage,
    head: () => ({
        meta: [
            { title: "Add Employee · TirthInfotech" },
            { name: "description", content: "Create a new employee profile for TirthInfotech." },
        ],
    }),
});


interface Department {
    id: number;
    name: string;
    code: string;
    description: string;
    is_active: boolean;
}
interface Designation {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
}
const employmentStatuses = [
    "ACTIVE",
    "INACTIVE",
    "RESIGNED",
] as const;

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    emergencyContact: string;
    gender: string;
    maritalStatus: string;
    dob: string;
    joiningDate: string;
    department: number | "";
    designation: number | "";
    ctc: string;
    employmentStatus: string;
    role: string;
    address: string;
    city: string;
    state: string;
    country: string;

}

const initialForm: FormState = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    gender: "",
    maritalStatus: "",
    dob: "",
    joiningDate: "",
    department: "",
    designation: "",
    ctc: "",
    employmentStatus: "ACTIVE",
    role: "EMPLOYEE",
    address: "",
    city: "",
    state: "",
    country: "India",

};

const requiredFields: Array<keyof FormState> = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "joiningDate",
    "department",
    "designation",
];

const inputClass =
    "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background/60 disabled:text-muted-foreground";

const errorInputClass = "border-danger focus:border-danger focus:ring-danger/15";

const NAME_REGEX = /^[A-Za-z ]+$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
};

const isFutureDate = (date: string): boolean => {
    const selected = new Date(date);
    const today = new Date();

    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selected > today;
};

function CardSection({
    title,
    description,
    className,
    children,
}: {
    title: string;
    description?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-resting)] sm:p-6",
                className
            )}
        >
            <div className="mb-5">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                ) : null}
            </div>
            {children}
        </div>
    );
}

function Field({
    label,
    required,
    htmlFor,
    error,
    className,
    children,
}: {
    label: string;
    required?: boolean;
    htmlFor?: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
                {label}
                {required ? <span className="ml-0.5 text-danger">*</span> : null}
            </label>
            {children}
            {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>
    );
}

function AddEmployeePage() {
    const [form, setForm] = useState<FormState>(initialForm);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setField = (
        field: keyof FormState,
        value: FormState[keyof FormState]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setProfilePhoto(file);

        const url = URL.createObjectURL(file);

        setPhotoPreview(url);
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [departmentResponse, designationResponse] = await Promise.all([
                    api.get("/departments/"),
                    api.get("/designations/"),
                ]);

                setDepartments(departmentResponse.data);
                setDesignations(designationResponse.data);
            } catch (error) {
                console.error("Failed to load master data:", error);
            }
        };

        fetchData();
    }, []);
    const removePhoto = () => {
        setPhotoPreview(null);
        setProfilePhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const validate = () => {
        const nextErrors: Partial<Record<keyof FormState, string>> = {};

        requiredFields.forEach((field) => {
            const value = form[field];

            if (
                value === "" ||
                value === null ||
                value === undefined ||
                (typeof value === "string" && value.trim() === "")
            ) {
                nextErrors[field] = "This field is required";
            }
        });

        // First Name
        if (form.firstName) {
            if (!NAME_REGEX.test(form.firstName.trim())) {
                nextErrors.firstName = "Only alphabets and spaces are allowed";
            }
        }

        // Last Name
        if (form.lastName) {
            if (!NAME_REGEX.test(form.lastName.trim())) {
                nextErrors.lastName = "Only alphabets and spaces are allowed";
            }
        }

        // Email
        if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
            nextErrors.email = "Enter a valid email address";
        }

        // Phone
        if (form.phone && !INDIAN_PHONE_REGEX.test(form.phone)) {
            nextErrors.phone =
                "Enter a valid 10-digit Indian mobile number";
        }

        // Emergency Contact
        if (
            form.emergencyContact &&
            !INDIAN_PHONE_REGEX.test(form.emergencyContact)
        ) {
            nextErrors.emergencyContact =
                "Enter a valid 10-digit Indian mobile number";
        }

        // DOB
        if (form.dob) {
            if (isFutureDate(form.dob)) {
                nextErrors.dob = "Date of birth cannot be in the future";
            } else if (calculateAge(form.dob) < 18) {
                nextErrors.dob = "Employee must be at least 18 years old";
            }
        }

        // Joining Date
        if (form.joiningDate && isFutureDate(form.joiningDate)) {
            nextErrors.joiningDate =
                "Joining date cannot be a future date";
        }

        // Annual CTC
        if (form.ctc) {
            const ctc = Number(form.ctc);

            if (Number.isNaN(ctc) || ctc <= 0) {
                nextErrors.ctc =
                    "Annual CTC must be greater than 0";
            }
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            const formData = new FormData();

            formData.append("first_name", form.firstName);
            formData.append("last_name", form.lastName);
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("emergency_contact", form.emergencyContact);
            formData.append("gender", form.gender);
            formData.append("marital_status", form.maritalStatus);

            if (form.dob) {
                formData.append("date_of_birth", form.dob);
            }

            formData.append("joining_date", form.joiningDate);

            formData.append("department", String(form.department));
            formData.append("designation", String(form.designation));

            formData.append("annual_ctc", form.ctc || "0");

            formData.append("address", form.address);
            formData.append("city", form.city);
            formData.append("state", form.state);
            formData.append("country", form.country);

            formData.append("status", form.employmentStatus);
            formData.append("role", form.role);

            if (profilePhoto) {
                formData.append("profile_photo", profilePhoto);
            }

            await createEmployee(formData);

            alert("Employee created successfully!");

            window.location.href = "/employees";
        } catch (error: any) {
            console.error(error);

            if (error.response?.data) {
                alert(JSON.stringify(error.response.data));
            } else {
                alert("Failed to create employee.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Add Employee"
                description="Create a new employee profile"
                breadcrumbs={[
                    { label: "Home" },
                    { label: "People" },
                    { label: "Employees" },
                    { label: "Add Employee" },
                ]}
            />
            <div className="mx-auto mt-6 flex max-w-[1440px] px-6 lg:px-8">
                <Link
                    to="/employees"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Employees
                </Link>
            </div>
            <form onSubmit={handleSubmit} className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Personal Information */}
                    <CardSection
                        title="Personal Information"
                        description="Basic identity and contact details"
                        className="lg:col-span-2"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Employee Code" htmlFor="employeeCode">
                                <input
                                    id="employeeCode"
                                    type="text"
                                    disabled
                                    placeholder="Auto Generated"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="First Name" required htmlFor="firstName" error={errors.firstName}>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) => setField("firstName", e.target.value)}
                                    placeholder="e.g. Aditi"
                                    className={cn(inputClass, errors.firstName && errorInputClass)}
                                />
                            </Field>

                            <Field label="Last Name" required htmlFor="lastName" error={errors.lastName}>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={form.lastName}
                                    onChange={(e) => setField("lastName", e.target.value)}
                                    placeholder="e.g. Sharma"
                                    className={cn(inputClass, errors.lastName && errorInputClass)}
                                />
                            </Field>

                            <Field label="Email" required htmlFor="email" error={errors.email}>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                    placeholder="name@gmail.com"
                                    className={cn(inputClass, errors.email && errorInputClass)}
                                />
                            </Field>

                            <Field label="Phone Number" required htmlFor="phone" error={errors.phone}>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setField("phone", e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className={cn(inputClass, errors.phone && errorInputClass)}
                                />
                            </Field>
                            <Field
                                label={
                                    form.maritalStatus === "MARRIED"
                                        ? "Spouse Contact Number"
                                        : "Parent Contact Number"
                                }
                                htmlFor="emergencyContact"
                                error={errors.emergencyContact}
                            >
                                <input
                                    id="emergencyContact"
                                    type="tel"
                                    value={form.emergencyContact}
                                    onChange={(e) => setField("emergencyContact", e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Gender" htmlFor="gender">
                                <select
                                    id="gender"
                                    value={form.gender}
                                    onChange={(e) => setField("gender", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </Field>

                            <Field label="Marital Status" htmlFor="maritalStatus">
                                <select
                                    id="maritalStatus"
                                    value={form.maritalStatus}
                                    onChange={(e) => setField("maritalStatus", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select status</option>
                                    <option value="SINGLE">Single</option>
                                    <option value="MARRIED">Married</option>
                                </select>
                            </Field>

                            <Field
                                label="Date of Birth"
                                htmlFor="dob"
                                error={errors.dob}
                            >
                                <input
                                    id="dob"
                                    type="date"
                                    value={form.dob}
                                    onChange={(e) => setField("dob", e.target.value)}
                                    className={cn(inputClass, "tabular")}
                                />
                            </Field>

                            <Field label="Profile Photo" className="sm:col-span-2 lg:col-span-1">
                                <div className="flex items-center gap-4">
                                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-dashed border-border bg-background/60">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <Camera className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-foreground hover:bg-accent"
                                            >
                                                <Camera className="h-3.5 w-3.5" />
                                                {photoPreview ? "Change" : "Upload"}
                                            </button>
                                            {photoPreview ? (
                                                <button
                                                    type="button"
                                                    onClick={removePhoto}
                                                    className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    Remove
                                                </button>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-muted-foreground">JPG or PNG, up to 2MB</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </div>
                            </Field>
                        </div>
                    </CardSection>

                    {/* Employment Information */}
                    <CardSection title="Employment Information" description="Role, department and compensation">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="Joining Date"
                                htmlFor="joiningDate"
                                error={errors.joiningDate}
                            >
                                <input
                                    id="joiningDate"
                                    type="date"
                                    value={form.joiningDate}
                                    onChange={(e) => setField("joiningDate", e.target.value)}
                                    className={cn(inputClass, "tabular")}
                                />
                            </Field>

                            <Field label="Department" htmlFor="department">
                                <select
                                    id="department"
                                    value={form.department}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            department: e.target.value ? Number(e.target.value) : "",
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="">Select department</option>
                                    {departments.map((department) => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Designation" htmlFor="designation">
                                <select
                                    id="designation"
                                    value={form.designation}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            designation: e.target.value ? Number(e.target.value) : "",
                                        }))
                                    }
                                    className={inputClass}
                                >
                                    <option value="">Select designation</option>
                                    {designations.map((designation) => (
                                        <option
                                            key={designation.id}
                                            value={designation.id}
                                        >
                                            {designation.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field
                                label="Annual CTC"
                                htmlFor="ctc"
                                error={errors.ctc}
                            >
                                <input
                                    id="ctc"
                                    type="number"
                                    min={0}
                                    value={form.ctc}
                                    onChange={(e) => setField("ctc", e.target.value)}
                                    placeholder="e.g. 1200000"
                                    className={cn(inputClass, "tabular")}
                                />
                            </Field>

                            <Field label="Employment Status" htmlFor="employmentStatus" className="sm:col-span-2">
                                <select
                                    id="employmentStatus"
                                    value={form.employmentStatus}
                                    onChange={(e) => setField("employmentStatus", e.target.value)}
                                    className={inputClass}
                                >
                                    {employmentStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0) + status.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Role" required htmlFor="role">
                                <select
                                    id="role"
                                    value={form.role}
                                    onChange={(e) => setField("role", e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </Field>
                        </div>
                    </CardSection>

                    {/* Address Information */}
                    <CardSection title="Address Information" description="Current residential address">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Address" htmlFor="address" className="sm:col-span-2">
                                <textarea
                                    id="address"
                                    rows={3}
                                    value={form.address}
                                    onChange={(e) => setField("address", e.target.value)}
                                    placeholder="Flat / Street / Locality"
                                    className={cn(inputClass, "h-auto resize-none py-2")}
                                />
                            </Field>

                            <Field label="City" htmlFor="city">
                                <input
                                    id="city"
                                    type="text"
                                    value={form.city}
                                    onChange={(e) => setField("city", e.target.value)}
                                    placeholder="e.g. Ahmedabad"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="State" htmlFor="state">
                                <input
                                    id="state"
                                    type="text"
                                    value={form.state}
                                    onChange={(e) => setField("state", e.target.value)}
                                    placeholder="e.g. Gujarat"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Country" htmlFor="country" className="sm:col-span-2">
                                <input
                                    id="country"
                                    type="text"
                                    value={form.country}
                                    onChange={(e) => setField("country", e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </CardSection>


                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-5">
                    <Link
                        to="/employees"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-accent"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
                    >
                        {loading ? "Saving..." : "Save Employee"}
                    </button>
                </div>
            </form>
        </>
    );
}