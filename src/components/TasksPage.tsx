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
import { styles, ColorConstants } from "../AppStyles";
import { Task, AppState, User } from "../App";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { TaskStackParamList, RootStackParamList } from "../navigation/types";
import { useAuth } from "../stores/auth-context";
import { log } from "../config/logger-config";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTasks } from "../services/get-user-tasks";

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

interface TaskCardProps {
  task: Task;
  onSelectTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelectTask }) => {
  const isOverdue = task.isOverdue;
  const isSubmitted = task.isSubmitted;
  const isCompleted = task.isCompleted;
  const isRejected = task.isRejected;

  let statusColor: string;
  let statusText: string;

  if (isOverdue) {
    statusColor = ColorConstants.danger;
    statusText = "Overdue";
  } else if (isSubmitted) {
    statusColor = ColorConstants.success;
    statusText = "Submitted";
  } else if (isCompleted) {
    statusColor = ColorConstants.info;
    statusText = "Completed";
  } else if (isRejected) {
    statusColor = ColorConstants.danger;
    statusText = "Rejected";
  } else {
    statusColor = ColorConstants.warning;
    statusText = "Pending Review";
  }

  const statusTagStyle: ViewStyle = {
    backgroundColor: statusColor,
  };

  return (
    <TouchableOpacity onPress={() => onSelectTask(task)}>
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order ID: {task.orderId}</Text>
          <View style={[styles.statusTag, statusTagStyle]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Factory: </Text>
              {task.factory}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Product: </Text>
              {task.product}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Stage: </Text>
              <Text style={styles.blueText}>{task.stage}</Text>
            </Text>
          </View>
          <View style={styles.cardDetails}>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Task ID: </Text>
              {task.taskId}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.label}>Task Type: </Text>
              {task.taskType}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  const { user, token } = useAuth();
  log.info("Auth page: ", user);
  log.info("User token: ", token);

  //tanstack api call
  const allentasks = useQuery({
    queryKey: ["tasks", token],
    queryFn: () => fetchUserTasks(token),
  });

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
    <View style={[{ paddingTop: insets.top, flex: 1 }, styles.safeArea]}>
      <View>
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <Text style={styles.title}>TASKS</Text>
          {/* <Text style={styles.title}>Hey {user?.fullName}</Text> */}

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navbar}
          style={{ marginVertical: 0 }}
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

        <ScrollView contentContainerStyle={styles.content}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelectTask={handleSelectTask}
              />
            ))
          ) : (
            <Text style={styles.noTasksText}>
              No tasks found in this section.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default TasksPage;
