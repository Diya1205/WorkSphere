import api from "@/services/api";

export interface Department {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentPayload {
  name: string;
  description?: string;
}

export const departmentService = {
  getDepartments: async (): Promise<Department[]> => {
    const { data } = await api.get("/departments/");
    // Defensive: works whether DRF pagination is on or off.
    return Array.isArray(data) ? data : data.results ?? [];
  },

  createDepartment: async (payload: DepartmentPayload): Promise<Department> => {
    const { data } = await api.post("/departments/", payload);
    return data;
  },

  updateDepartment: async (id: number, payload: DepartmentPayload): Promise<Department> => {
    const { data } = await api.patch(`/departments/${id}/`, payload);
    return data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}/`);
  },
};