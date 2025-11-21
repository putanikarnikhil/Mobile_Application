// App.tsx
import React, { useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthStackNavigator from "./navigation/AuthStack";
import RootNavigator from "./navigation/RootNavigator";
import { ColorConstants } from "./AppStyles";

// ====================================================================
// CORE TYPE DEFINITIONS (REQUIRED FOR TASK DETAIL PAGE TO WORK)
// ====================================================================

export interface User {
  name: string;
  email: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

// CRITICAL FIX: Define the SubmissionData type for TypeScript to recognize it
export interface SubmissionData {
  auditComment: string;
  submittedOn: string; // ISO date string
  location: LocationData;
}

export interface Task {
  id: string;
  orderId: string;
  orderStageId: string;
  taskId: string;
  factory: string;
  product: string;
  stage: string;
  stageStatus: "Active" | "Inactive" | "Completed";
  taskType: string;
  status: "Pending Review" | "Submitted" | "Rejected" | "Completed" | "Overdue";
  isOverdue: boolean;
  isSubmitted: boolean;
  isCompleted: boolean;
  isRejected: boolean;
  photos: string[];
  comments: string;

  // CRITICAL FIX: Add the optional submissionData property
  submissionData?: SubmissionData;
}

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

// ====================================================================
// MOCK DATA
// ====================================================================

const mockImageUri = "https://picsum.photos/id/102/100/100";
const mockImageUri2 = "https://picsum.photos/id/103/100/100";

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    orderId: "ORD-2024-001",
    orderStageId: "STG-KNT-001",
    taskId: "TSK-KNT-2024-001",
    factory: "Premium Textiles Ltd",
    product: "Cotton Polo Shirt",
    stage: "Knitting",
    stageStatus: "Active",
    taskType: "Quality Check",
    status: "Pending Review",
    isOverdue: false,
    isSubmitted: false,
    isCompleted: false,
    isRejected: false,
    photos: [],
    comments: "Initial inspection required.",
  },
  // Example of a task that has been submitted and should show audit data
  {
    id: "2",
    orderId: "ORD-2024-002",
    orderStageId: "STG-DYG-001",
    taskId: "TSK-DYG-2024-002",
    factory: "Bright Dyes Inc",
    product: "Denim Fabric",
    stage: "Dyeing",
    stageStatus: "Active",
    taskType: "Color Audit",
    status: "Submitted",
    isOverdue: false,
    isSubmitted: true,
    isCompleted: false,
    isRejected: false,
    photos: [mockImageUri, mockImageUri2, mockImageUri, mockImageUri2],
    comments: "Task submitted successfully.",
    submissionData: {
      auditComment:
        "Dye lot 4A checked. Color match is 98%. Ready for next stage.",
      submittedOn: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      location: {
        latitude: 34.0522,
        longitude: 118.2437,
        address: "456 Dye Street, Los Angeles, CA 90013",
      },
    },
  },
  {
    id: "3",
    orderId: "ORD-2024-003",
    orderStageId: "STG-FIN-001",
    taskId: "TSK-FIN-2024-003",
    factory: "Quick Finish Co",
    product: "Jacket Linings",
    stage: "Finishing",
    stageStatus: "Active",
    taskType: "Durability Test",
    status: "Pending Review",
    isOverdue: true,
    isSubmitted: false,
    isCompleted: false,
    isRejected: false,
    photos: [],
    comments: "Urgent: Must be completed today.",
  },
  {
    id: "4",
    orderId: "ORD-2024-004",
    orderStageId: "STG-TRM-001",
    taskId: "TSK-TRM-2024-004",
    factory: "Trim Master",
    product: "Buttons & Zippers",
    stage: "Trimming",
    stageStatus: "Completed",
    taskType: "Inventory Check",
    status: "Completed",
    isOverdue: false,
    isSubmitted: true,
    isCompleted: true,
    isRejected: false,
    photos: [mockImageUri],
    comments: "Inventory confirmed.",
  },
];

// ====================================================================
// APP COMPONENT
// ====================================================================

const App: React.FC = () => {
  // Authentication State
  const [appAuthState, setAppAuthState] = useState<{
    user: User | null;
    view: "login" | "tasks";
  }>({
    user: { name: "Nikhil", email: "raj@verdeind.com" }, // Start logged in for easier development
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
  const updateTaskStatus = (
    taskId: string,
    newStatus: Task["status"],
    newImages: string[],
    newComment: string,
    locationData?: LocationData
  ) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          // Determine boolean flags based on the new status
          const isSubmitted = newStatus === "Submitted";
          const isRejected = newStatus === "Rejected";
          const isCompleted = newStatus === "Completed";

          const submission: SubmissionData | undefined = locationData
            ? {
                auditComment: newComment,
                submittedOn: new Date().toISOString(),
                location: locationData,
              }
            : task.submissionData; // Preserve existing if no new location data

          return {
            ...task,
            status: newStatus,
            isSubmitted: isSubmitted,
            isRejected: isRejected,
            isCompleted: isCompleted,

            // CRITICAL: SAVE THE SUBMISSION DATA TO THE PERMANENT TASK OBJECT
            photos: newImages,
            comments: newComment,
            submissionData: submission,
          };
        }
        return task;
      })
    );

    // Clear temporary state after submission/rejection
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
      setProfileImage: setProfileImage, // Also include profile setter here for convenience
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

  if (appAuthState.view === "login") {
    return (
      <View style={styles.container}>
        <NavigationContainer>
          <AuthStackNavigator setAppState={setAppAuthState} />
        </NavigationContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <RootNavigator
          tasks={tasks}
          appState={appState}
          setAppState={setAppAuthState}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          profileImage={profileImage}
          setProfileImage={setProfileImage}
          setActiveSection={setActiveSection}
        />
      </NavigationContainer>
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

// // App.tsx
// import React, { useState, useEffect } from 'react';
// import { StyleSheet, Platform, UIManager, LayoutAnimation } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { styles } from './AppStyles';
// import LoginPage from './components/LoginPage';
// import TasksPage from './components/TasksPage';
// import TaskDetailPage from './components/TaskDetailPage';
// import ProfilePage from './components/ProfilePage';
// import NotificationsPage from './components/NotificationsPage';

// // Enable LayoutAnimation for Android
// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// // Type Definitions
// export interface Task {
//   id: string;
//   orderId: string;
//   orderStageId: string;
//   factory: string;
//   product: string;
//   stage: string;
//   taskId: string;
//   taskType: string;
//   status: 'Pending Review' | 'Submitted' | 'Overdue' | 'Completed' | 'Rejected';
//   stageStatus: string;
//   isOverdue: boolean;
//   isSubmitted: boolean;
//   isCompleted: boolean;
//   isRejected: boolean;
//   photos: string[];
//   comments: string;
// }

// export interface User {
//   name: string;
//   email: string;
// }

// export interface AppState {
//   view: 'login' | 'tasks' | 'taskDetail' | 'profile' | 'notifications';
//   user: User | null;
//   activeSection: string;
//   taskDetail: Task | null;
// }

// const initialTasks: Task[] = [
//   { id: '1', orderId: 'ORD-2024-001', orderStageId: 'STG-KNT-001', factory: 'Premium Textiles Ltd', product: 'Cotton Polo Shirts', stage: 'Knitting', taskId: 'TSK-KNT-2024-001', taskType: 'Quality Check', status: 'Pending Review', stageStatus: 'Active', isOverdue: false, isSubmitted: false, isCompleted: false, isRejected: false, photos: [], comments: '' },
//   { id: '2', orderId: 'ORD-2024-002', orderStageId: 'STG-DYG-001', factory: 'Elite Garments Co', product: 'Denim Jackets', stage: 'Dyeing', taskId: 'TSK-DYG-2024-001', taskType: 'Quality Check', status: 'Submitted', stageStatus: 'Active', isOverdue: false, isSubmitted: true, isCompleted: false, isRejected: false, photos: [], comments: '' },
//   { id: '3', orderId: 'ORD-2024-003', orderStageId: 'STG-FNS-001', factory: 'Modern Mills Inc', product: 'Silk Scarves', stage: 'Finishing', taskId: 'TSK-FNS-2024-001', taskType: 'Quality Check', status: 'Overdue', stageStatus: 'Active', isOverdue: true, isSubmitted: false, isCompleted: false, isRejected: false, photos: [], comments: '' },
//   { id: '4', orderId: 'ORD-2024-004', orderStageId: 'STG-FNS-002', factory: 'Modern Mills Inc', product: 'Silk Scarves', stage: 'Finishing', taskId: 'TSK-FNS-2024-002', taskType: 'Quality Check', status: 'Completed', stageStatus: 'Active', isOverdue: false, isSubmitted: false, isCompleted: true, isRejected: false, photos: [], comments: '' },
//   { id: '5', orderId: 'ORD-2024-005', orderStageId: 'STG-FNS-003', factory: 'Modern Mills Inc', product: 'Silk Scarves', stage: 'Finishing', taskId: 'TSK-FNS-2024-003', taskType: 'Quality Check', status: 'Overdue', stageStatus: 'Active', isOverdue: true, isSubmitted: false, isCompleted: false, isRejected: false, photos: [], comments: '' },
//   { id: '6', orderId: 'ORD-2024-006', orderStageId: 'STG-FNS-004', factory: 'Modern Mills Inc', product: 'Silk Scarves', stage: 'Finishing', taskId: 'TSK-FNS-2024-004', taskType: 'Quality Check', status: 'Rejected', stageStatus: 'Active', isOverdue: false, isSubmitted: false, isCompleted: false, isRejected: true, photos: [], comments: '' },
// ];

// export default function App() {
//   const [tasks, setTasks] = useState<Task[]>(initialTasks);
//   const [appState, setAppState] = useState<AppState>({ view: 'login', user: null, activeSection: 'Active Tasks', taskDetail: null });
//   const [images, setImages] = useState<string[]>([]);
//   const [comment, setComment] = useState<string>('');
//   const [searchQuery, setSearchQuery] = useState<string>('');
//   const [profileImage, setProfileImage] = useState<string | null>(null);

//   const updateTaskStatus = (taskId: string, newStatus: Task['status'], newImages: string[], newComment: string) => {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setTasks(prevTasks =>
//       prevTasks.map(task => {
//         if (task.id === taskId) {
//           return {
//             ...task,
//             status: newStatus,
//             isOverdue: false,
//             isSubmitted: newStatus === 'Submitted',
//             isCompleted: newStatus === 'Completed',
//             isRejected: newStatus === 'Rejected',
//             photos: newImages,
//             comments: newComment
//           };
//         }
//         return task;
//       })
//     );
//   };

//   const renderContent = () => {
//     switch (appState.view) {
//       case 'login':
//         return <LoginPage setAppState={setAppState} />;
//       case 'tasks':
//         return (
//           <TasksPage
//             tasks={tasks}
//             appState={appState}
//             setAppState={setAppState}
//             searchQuery={searchQuery}
//             setSearchQuery={setSearchQuery}
//             profileImage={profileImage}
//             setImages={setImages}
//             setComment={setComment}
//           />
//         );
//       case 'taskDetail':
//         if (!appState.taskDetail) return null;
//         return (
//           <TaskDetailPage
//             task={appState.taskDetail}
//             onGoBack={() => setAppState(prevState => ({ ...prevState, view: 'tasks', taskDetail: null }))}
//             onTaskUpdate={updateTaskStatus}
//             images={images}
//             setImages={setImages}
//             comment={comment}
//             setComment={setComment}
//           />
//         );
//       case 'profile':
//         if (!appState.user) return null;
//         return (
//           <ProfilePage
//             user={appState.user}
//             profileImage={profileImage}
//             setProfileImage={setProfileImage}
//             onGoBack={() => setAppState(prevState => ({ ...prevState, view: 'tasks' }))}
//             setAppState={setAppState}
//           />
//         );
//       case 'notifications':
//         return <NotificationsPage onGoBack={() => setAppState(prevState => ({ ...prevState, view: 'profile' }))} />;
//       default:
//         return null;
//     }
//   };

//   return <SafeAreaProvider>{renderContent()}</SafeAreaProvider>;
// }
