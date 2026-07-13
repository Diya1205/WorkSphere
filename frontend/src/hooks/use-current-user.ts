import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE";
  
export interface CurrentUser {
  id: number;
  employeeId: number | null;
  username: string;
  email: string;
  fullName: string;
  role: AppRole;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],

    queryFn: async () => {
      const token = sessionStorage.getItem("access");

      if (!token) {
        return null;
      }

      const response = await api.get("/auth/");

      return {
        id: response.data.id,
        employeeId: response.data.employee_id,
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.full_name,
        role: response.data.role,
      };
    },
  });
}