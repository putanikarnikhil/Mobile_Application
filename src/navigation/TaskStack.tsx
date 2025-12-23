// navigation/TaskStack.tsx
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { Alert } from "react-native";
import TasksPage from "../components/tasks/TasksPage";
import TaskDetailPage from "../components/tasks/TaskDetailPage";
import { Task, AppState, User, LocationData } from "../App";
import { TaskStackParamList } from "./types";
import {
  submitTaskWithImagesAndLocation,
  rejectTask,
} from "../services/update-task-status";
import { log } from "../config/logger-config";

const Stack = createStackNavigator<TaskStackParamList>();

type CustomSetAppState = (newState: {
  user: User | null;
  view: "login" | "tasks";
}) => void;

interface TaskStackProps {
  tasks: Task[];
  appState: AppState;
  setAppState: CustomSetAppState;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  profileImage: string | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
}

const TaskStackNavigator: React.FC<TaskStackProps> = (props) => {
  /**
   * Main task update handler - orchestrates API calls
   */
  const onTaskUpdate = async (
    taskId: string,
    status: Task["status"],
    images: string[],
    comment: string,
    location?: LocationData
  ) => {
    if (!location) {
      throw new Error("Location is required for task submission");
    }

    try {
      log.debug("🚀 Starting task submission...", {
        taskId,
        status,
        imagesCount: images.length,
        hasComment: !!comment,
        hasLocation: !!location,
      });

      // Handle rejection separately
      if (status === "Rejected") {
        await rejectTask(
          taskId,
          comment || "Task rejected by auditor",
          location
        );

        return;
      }

      // Handle completion with images and location
      if (status === "Completed") {
        await submitTaskWithImagesAndLocation(
          taskId,
          images,
          comment,
          location,
          "Completed"
        );

        return;
      }

      // Other status updates (if needed in future)
      log.warn("⚠️ Unhandled status:", status);
    } catch (err: any) {
      log.error("❌ Task update failed:", err);

      // Re-throw with user-friendly message
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit task. Please try again.";

      throw new Error(errorMessage);
    }
  };

  return (
    <Stack.Navigator
      initialRouteName="TasksList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TasksList">
        {() => (
          <TasksPage {...props} setActiveSection={props.setActiveSection} />
        )}
      </Stack.Screen>

      <Stack.Screen name="TaskDetail">
        {({ route, navigation }) => {
          const { task } = route.params;
          return (
            <TaskDetailPage
              task={task}
              onGoBack={() => navigation.goBack()}
              onTaskUpdate={onTaskUpdate}
              images={props.appState.images}
              setImages={props.appState.setImages}
              comment={props.appState.comment}
              setComment={props.appState.setComment}
              navigation={navigation as any}
              route={route as any}
            />
          );
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default TaskStackNavigator;
