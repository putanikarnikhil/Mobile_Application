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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles, ColorConstants } from "../../AppStyles";
import { Task, AppState, User } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { TaskStackParamList, RootStackParamList } from "../../navigation/types";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTasks } from "../../services/get-user-tasks";
import { useUser } from "../../lib/auth-config";
import TaskCard, { TaskItem } from "./TasksCard";
import { mapApiResponseToTasks } from "../../utils/transformations/task-transform";

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
  return tasksList.filter(
    (task) =>
      task.orderId.toLowerCase().includes(lowercasedQuery) ||
      task.factory.toLowerCase().includes(lowercasedQuery) ||
      task.taskId.toLowerCase().includes(lowercasedQuery)
  );
};

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
  const id = userData?.user?._id;
  const token = userData?.token;

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => fetchUserTasks({ userObjId: id }),
    enabled: !!token,
  });

  const updatedTasks: TaskItem[] = mapApiResponseToTasks(data?.data || []);

  const handleSelectTask = (selectedTask: TaskItem) => {
    navigation.navigate("TaskDetail", {
      task: {
        ...selectedTask,
        id: selectedTask.taskId,
        orderStageId: "",
        photos: [],
        comments: "",
        stage: selectedTask.stageName,
        product: `${selectedTask.productType} ${selectedTask.productClass} ${selectedTask.productSubclass}`,
        stageStatus: "Active",
        taskType: "Audit",
        status: "Pending Review",
        isOverdue: false,
        isSubmitted: false,
        isCompleted: false,
        isRejected: false,
        submissionData: undefined,
      },
    });
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

      {/* Horizontal Nav - MinHeight removed to fix spacing */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navbar}
      >
        {[
          "Pending Tasks",
          "Completed Tasks",
          "Submitted Tasks",
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

      {/* Main List - With Pull To Refresh */}
<ScrollView
  contentContainerStyle={{
    paddingBottom: 20, // 👈 reduced
  }}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
  }
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
          {updatedTasks.length > 0 ? (
            updatedTasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onSelectTask={handleSelectTask}
              />
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