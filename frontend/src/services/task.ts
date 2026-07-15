import api from "./api";

export const getTasks = async () => {
  const response = await api.get("/tasks/");
  return response.data;
};

export const getTask = async (id: number) => {
  const response = await api.get(`/tasks/${id}/`);
  return response.data;
};

export const createTask = async (data: any) => {
  const response = await api.post("/tasks/", data);
  return response.data;
};

export const updateTask = async (id: number, data: any) => {
  const response = await api.put(`/tasks/${id}/`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  await api.delete(`/tasks/${id}/`);
};

export const updateTaskStatus = async (
  id: number,
  data: any
) => {
  const response = await api.patch(
    `/tasks/${id}/update_status/`,
    data
  );

  return response.data;
};