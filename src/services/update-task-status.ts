import api from "./api";

export const updateTaskStatus = async (
  taskId: string,
  payload: any
) => {
  const response = await api.put(`/task/update/${taskId}`, payload);
  return response.data;
};
