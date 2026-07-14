import api from "./api";

export const createEmployee = async (formData: FormData) => {
  const response = await api.post("/employees/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getEmployees = async () => {
  const response = await api.get("/employees/");
  return response.data;
};