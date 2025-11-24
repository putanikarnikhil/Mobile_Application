import api from "./api";

type fetchUserTasksProps = {
  userObjId: string | null;
};

//TODO: Change the arg type of below function to fetchUserTasksProps later
export async function fetchUserTasks(userObjId: string | null | undefined) {
  try {
    const response = await api.get("/task/getAll", {
      params: { userObjId },
    });

    console.log("TASK RESPONSE:", response.data);
    return response.data;
  } catch (error) {
    console.error("ERROR FETCHING TASKS:", error);
    throw error;
  }
}
