import api from "@/services/api";

export interface ProfileData {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  emergency_contact: string | null;
  profile_photo: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  marital_status: "SINGLE" | "MARRIED";
  date_of_birth: string | null;
  joining_date: string;
  department: number;
  department_name: string;
  designation: number;
  designation_name: string;
  annual_ctc: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: "ACTIVE" | "INACTIVE" | "RESIGNED";
  role: "ADMIN" | "EMPLOYEE";
}

export async function getProfile(): Promise<ProfileData> {
  const response = await api.get("/profile/");
  return response.data;
}

export async function updateProfile(
  payload: FormData | Record<string, unknown>
): Promise<ProfileData> {
  const response = await api.patch("/profile/", payload, {
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });
  return response.data;
}