// services/tasksService.ts
import api from "./api";

export async function updateTaskStatusAPI(taskId: string, status: string, comment: string, pictures: string[], location?: any) {
  const response = await api.put(`/task/update/${taskId}`, {
    status,
    comment,
    pictures,
    location,
  });

  return response.data;
}
