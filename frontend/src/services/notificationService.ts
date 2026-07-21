import api from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  reference_type: string | null;
  reference_id: number | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}

export const getNotifications = async () => {
  const { data } = await api.get<Notification[]>("/notifications/");
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get<{ count: number }>(
    "/notifications/unread_count/"
  );
  return data.count;
};

export const markNotificationRead = async (id: number) => {
  const { data } = await api.post(
    `/notifications/${id}/mark_read/`
  );
  return data;
};

export const markAllNotificationsRead = async () => {
  await api.post("/notifications/mark_all_read/");
};