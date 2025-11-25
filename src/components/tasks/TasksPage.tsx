// components/TasksPage.tsx
import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Image,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles, ColorConstants } from "../../AppStyles";
import { Task, AppState, User } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { TaskStackParamList, RootStackParamList } from "../../navigation/types";
import { useAuth } from "../../stores/auth-context";
import { log } from "../../config/logger-config";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTasks } from "../../services/get-user-tasks";
import { useUser } from "../../lib/auth-config";
import TaskCard, { TaskItem } from "./TasksCard";

type TasksPageNavigationProp = StackNavigationProp<
  TaskStackParamList & RootStackParamList,
  "TasksList"
>;

interface TasksPageProps {
  tasks: Task[];
  appState: AppState;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
  setAppState: (newState: {
    user: User | null;
    view: "login" | "tasks";
  }) => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  profileImage: string | null;
}

const getFilteredTasks = (
  tasksList: Task[],
  activeSection: string,
  searchQuery: string
): Task[] => {
  const lowercasedQuery = searchQuery.toLowerCase();
  let filteredBySection: Task[];
  switch (activeSection) {
    case "Active Tasks":
      filteredBySection = tasksList.filter(
        (task) => task.isOverdue || task.status === "Pending Review"
      );
      break;
    case "Submitted Tasks":
      filteredBySection = tasksList.filter((task) => task.isSubmitted);
      break;
    case "Completed Tasks":
      // Filter specifically for Completed Tasks
      filteredBySection = tasksList.filter((task) => task.isCompleted);
      break;
    case "Rejected Tasks":
      // Filter specifically for Rejected Tasks
      filteredBySection = tasksList.filter((task) => task.isRejected);
      break;
    default:
      filteredBySection = tasksList;
  }
  return filteredBySection.filter(
    (task) =>
      task.orderId.toLowerCase().includes(lowercasedQuery) ||
      task.factory.toLowerCase().includes(lowercasedQuery) ||
      task.taskId.toLowerCase().includes(lowercasedQuery)
  );
};

export const DUMMY_TASKS: TaskItem[] = [
  {
    orderId: "MODEL-PRO-001",
    taskId: "OT01",
    factory: "VISHNU CLOTHING COMPANY",
    productType: "Pant",
    productClass: "Formal",
    productSubclass: "Half Sleeve",
    stageName: "Knitting",
    dueDate: "2025-12-03T00:00:00.000Z",
    priority: "Low",
  },
  {
    orderId: "MODEL-PRO-002",
    taskId: "OT02",
    factory: "PREMIUM TEXTILES LTD",
    productType: "Shirt",
    productClass: "Casual",
    productSubclass: "Full Sleeve",
    stageName: "Cutting",
    dueDate: "2025-12-05T00:00:00.000Z",
    priority: "High",
  },
  {
    orderId: "MODEL-PRO-003",
    taskId: "OT03",
    factory: "STAR GARMENTS",
    productType: "Jacket",
    productClass: "Winter",
    productSubclass: "Hooded",
    stageName: "Stitching",
    dueDate: "2025-12-10T00:00:00.000Z",
    priority: "Medium",
  },
  {
    orderId: "MODEL-PRO-004",
    taskId: "OT04",
    factory: "ROYAL FABRICS",
    productType: "T-Shirt",
    productClass: "Sports",
    productSubclass: "Sleeveless",
    stageName: "Finishing",
    dueDate: "2025-12-12T00:00:00.000Z",
    priority: "Low",
  },
  {
    orderId: "MODEL-PRO-005",
    taskId: "OT05",
    factory: "NEW AGE FASHIONS",
    productType: "Shorts",
    productClass: "Casual",
    productSubclass: "Printed",
    stageName: "Embroidery",
    dueDate: "2025-12-08T00:00:00.000Z",
    priority: "High",
  },
];

const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  appState,
  searchQuery,
  setSearchQuery,
  profileImage,
  setActiveSection,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TasksPageNavigationProp>();
  const { data: userData } = useUser();
  const user = userData?.user;
  const id = userData?.user?._id;

  log.info("User data in TasksPage:", user);
  log.info("User id data in TasksPage:", id);
  // log.info("Token data in TasksPage:", token);

  const token = userData?.token;

  //tanstack api call
  const { data, error, status } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchUserTasks(id),
    enabled: !!token,
  });

  log.info("User tasks in Taskspage:", data);
  log.info("Tasks error in Taskspage:", error);

  const filteredTasks = getFilteredTasks(
    tasks,
    appState.activeSection,
    searchQuery
  );

  const handleSelectTask = (task: Task) => {
    if (appState.setImages) appState.setImages(task.photos);
    if (appState.setComment) appState.setComment(task.comments);

    console.log("Task has been clicked");

    navigation.navigate("TaskDetail", { task });
  };

  const handleProfilePress = () => {
    if (appState.user) {
      navigation.navigate("ProfileModal", {
        user: appState.user,
        profileImage: profileImage,
      });
    }
  };

  return (
    <View
      style={[
        { paddingTop: insets.top, paddingBottom: insets.bottom, flex: 1 },
        styles.safeArea,
      ]}
    >
      <StatusBar barStyle="dark-content" />

      {/* FIXED HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileIconContainer}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileIconImage}
            />
          ) : (
            <Text style={styles.profileIconText}>
              {appState.user?.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* FIXED HORIZONTAL NAVIGATION - MOVED OUTSIDE MAIN SCROLL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navbar}
        style={{
          marginVertical: 0,
          minHeight: 65,
        }}
      >
        {[
          "Active Tasks",
          "Submitted Tasks",
          "Completed Tasks",
          "Rejected Tasks",
        ].map((section) => (
          <View key={section} style={styles.taskCategoryContainer}>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setActiveSection(section);
              }}
              style={[
                styles.navItem,
                appState.activeSection === section && styles.activeNavItem,
              ]}
            >
              <Text
                style={[
                  styles.navItemText,
                  appState.activeSection === section &&
                    styles.activeNavItemText,
                ]}
              >
                {section}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* MAIN VERTICAL SCROLL - NOW ONLY FOR CONTENT */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={styles.searchIcon.color}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID, Factory, or Task ID"
            placeholderTextColor={ColorConstants.faintText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.content}>
          {DUMMY_TASKS.length > 0 ? (
            DUMMY_TASKS.map((task) => (
              <TaskCard key={task.taskId} task={task} onSelectTask={() => {}} />
            ))
          ) : (
            <Text style={styles.noTasksText}>
              No tasks found in this section.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TasksPage;
