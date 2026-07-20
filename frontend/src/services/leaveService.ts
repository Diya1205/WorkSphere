import api from "@/services/api";
export type LeaveType = "SICK" | "CASUAL" | "EMERGENCY" | "PERSONAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Leave {
  id: number;
  employee: number;
  employee_name: string;
  employee_code: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  applied_at: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  admin_remarks: string | null;
  updated_at: string;
}

export interface ApplyLeavePayload {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface DecisionPayload {
  admin_remarks?: string;
}

export const leaveService = {
  getLeaves: async (): Promise<Leave[]> => {
    const { data } = await api.get("/leaves/");
    return data;
  },

  applyLeave: async (payload: ApplyLeavePayload): Promise<Leave> => {
    const { data } = await api.post("/leaves/", payload);
    return data;
  },

  updateLeave: async (id: number, payload: Partial<ApplyLeavePayload>): Promise<Leave> => {
    const { data } = await api.put(`/leaves/${id}/`, payload);
    return data;
  },

  deleteLeave: async (id: number): Promise<void> => {
    await api.delete(`/leaves/${id}/`);
  },

  approveLeave: async (id: number, payload: DecisionPayload = {}): Promise<Leave> => {
    const { data } = await api.post(`/leaves/${id}/approve/`, payload);
    return data;
  },

  rejectLeave: async (id: number, payload: DecisionPayload = {}): Promise<Leave> => {
    const { data } = await api.post(`/leaves/${id}/reject/`, payload);
    return data;
  },

  cancelLeave: async (id: number): Promise<Leave> => {
    const { data } = await api.post(`/leaves/${id}/cancel/`, {});
    return data;
  },
};