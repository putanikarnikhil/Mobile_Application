// App.tsx
import React, { useState, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ColorConstants } from "./AppStyles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryConfig } from "./lib/react-query-config";
import AppNavigator from "./navigation/AppNavigator";
import { AuthLoader } from "./lib/auth-config";
import { AuthProvider } from "./stores/auth-context";
import { uploadPhoto } from "./services/upload-photo";


export interface User {
  _id: string;
  name: string;
  email: string;
}

// CRITICAL FIX: Define the SubmissionData type for TypeScript to recognize it
export interface SubmissionData {
  auditComment: string;
  submittedOn: string; // ISO date string
  location: LocationData;
}

export interface Task {
  stageName: React.JSX.Element;
  _id(_id: any, status: string, images: string[], comment: string, arg4: LocationData | undefined): unknown;
    address?: {
    latitude: number;
    longitude: number;
    fullAddress: string;
  } | null;
  rejectionReason?: string | null;
  remarks?: string | null;
  completedOn?: string | null;
  dueDate: string | number | Date;
  id: string;
  orderId: string;
  orderStageId: string;
  taskId: string;
  factory: string;
  product: string;
  stage: string;
  stageStatus: "Active" | "Inactive" | "Completed";
  taskType: string;
  status: "Pending" | "Accepted" | "Completed" | "Rejected" | "Overdue";
  priority: string;
  isOverdue: boolean;
  isSubmitted: boolean;
  isCompleted: boolean;
  isRejected: boolean;
  photos: string[];
  comments: string;

  submissionData?: SubmissionData;

  
}


export type LocationData = {
  latitude: number;
  longitude: number;
  address: string;
details?: {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

};


// Define the root application state structure
export interface AppState {
  user: User | null;
  view: "login" | "tasks";
  activeSection: string;

  // State setters (passed to TaskDetailPage via AppState)
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;

  // Function to persist task updates (Critical for submission data)
  updateTaskStatus: (
    taskId: string,
    newStatus: Task["status"],
    newImages: string[],
    newComment: string,
    locationData?: LocationData
  ) => void;
}

const INITIAL_TASKS: Task[] = [
  
];

const App: React.FC = () => {
  // Authentication State
  const [appAuthState, setAppAuthState] = useState<{
    user: User | null;
    view: "login" | "tasks";
  }>({
   user: { _id: "12345", name: "Nikhil", email: "raj@verdeind.com" },

    view: "tasks",
  });

  // Root Task State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeSection, setActiveSection] = useState<string>("Active Tasks");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Profile State
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Temporary State for TaskDetailPage (images/comments being collected for current task)
  const [tempImages, setTempImages] = useState<string[]>([]);
  const [tempComment, setTempComment] = useState<string>("");

  // CRITICAL FUNCTION: Persists submission data into the main tasks array
const updateTaskStatus = async (
  taskId: string,
  newStatus: Task["status"],
  newImages: string[],
  newComment: string,
  locationData?: LocationData
) => {

  const uploadedUrls: string[] = [];

  for (const fileUri of newImages) {
    const uploadedUrl = await uploadPhoto(fileUri);
    uploadedUrls.push(uploadedUrl);
  }

  setTasks(prev =>
    prev.map(task =>
      task.id === taskId
        ? {
            ...task,
            status: newStatus,
            isSubmitted: newStatus === "Accepted",
            isRejected: newStatus === "Rejected",
            isCompleted: newStatus === "Completed",
            photos: uploadedUrls,
            comments: newComment,
            submissionData: locationData
              ? {
                  auditComment: newComment,
                  submittedOn: new Date().toISOString(),
                  location: locationData,
                }
              : task.submissionData,
          }
        : task
    )
  );

  setTempImages([]);
  setTempComment("");
};

  // Combine state and setters into a single AppState object for easy prop drilling
  const appState: AppState & {
    setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  } = useMemo(
    () => ({
      user: appAuthState.user,
      view: appAuthState.view,
      activeSection: activeSection,

      images: tempImages,
      setImages: setTempImages,
      comment: tempComment,
      setComment: setTempComment,

      updateTaskStatus: updateTaskStatus,
      setProfileImage: setProfileImage,  
    }),
    [
      appAuthState.user,
      appAuthState.view,
      activeSection,
      tempImages,
      tempComment,
      profileImage,
    ]
  );

  //query client tanstack
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      })
  );
  return (
    <View style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthLoader
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" />
              </View>
            )}
          >
            <AppNavigator
              tasks={tasks}
              appState={appState}
              setAppState={setAppAuthState}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              profileImage={profileImage}
              setProfileImage={setProfileImage}
              setActiveSection={setActiveSection}
            />
          </AuthLoader>
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorConstants.background,
  },
});

export default App;
