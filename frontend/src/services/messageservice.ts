import api from "@/services/api";
export type ConversationType = "DIRECT" | "GROUP" | "EVERYONE";

export interface Participant {
  employee_id: number;
  full_name: string;
  role: string;
  employee_code: string;
  profile_photo: string | null;
  joined_at: string;
}

export interface LastMessage {
  id: number;
  message: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  conversation_type: ConversationType;
  name: string | null;
  display_name: string;
  participants: Participant[];
  last_message: LastMessage | null;
  unread_count: number;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender_id: number;
  sender_name: string;
  sender_profile_photo: string | null;
  message: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

export interface MessagesPage {
  results: Message[];
  has_more: boolean;
}

// Lightweight shape — just what the "new conversation" picker needs.
// Reuses the existing /employees/ endpoint rather than introducing a new one.
export interface EmployeeOption {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  role: "ADMIN" | "EMPLOYEE";
  profile_photo: string | null;
  status: string;
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const { data } = await api.get("/messages/conversations/");
    return data;
  },

  getConversation: async (id: number): Promise<Conversation> => {
    const { data } = await api.get(`/messages/conversations/${id}/`);
    return data;
  },

  createDirectConversation: async (receiverId: number): Promise<Conversation> => {
    const { data } = await api.post("/messages/conversations/", {
      conversation_type: "DIRECT",
      receiver: receiverId,
    });
    return data;
  },

  createGroupConversation: async (
    participantIds: number[],
    name?: string,
  ): Promise<Conversation> => {
    const { data } = await api.post("/messages/conversations/", {
      conversation_type: "GROUP",
      participants: participantIds,
      name,
    });
    return data;
  },

  createEveryoneConversation: async (): Promise<Conversation> => {
    const { data } = await api.post("/messages/conversations/", {
      conversation_type: "EVERYONE",
    });
    return data;
  },

  getMessages: async (conversationId: number, beforeId?: number): Promise<MessagesPage> => {
    const { data } = await api.get(`/messages/conversations/${conversationId}/messages/`, {
      params: beforeId ? { before_id: beforeId } : undefined,
    });
    return data;
  },

  sendMessage: async (conversationId: number, message: string): Promise<Message> => {
    const { data } = await api.post(`/messages/conversations/${conversationId}/messages/`, {
      message,
    });
    return data;
  },

  editMessage: async (messageId: number, message: string): Promise<Message> => {
    const { data } = await api.put(`/messages/${messageId}/`, { message });
    return data;
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/messages/${messageId}/`);
  },

  // Reuses the existing employees list endpoint for the "new conversation" picker.
  getEmployeeOptions: async (): Promise<EmployeeOption[]> => {
    const { data } = await api.get("/employees/");
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list.filter((e: EmployeeOption) => e.status === "ACTIVE");
  },
};