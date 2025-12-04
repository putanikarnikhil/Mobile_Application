// components/tasks/TasksPage.tsx
import React, { useEffect } from "react";
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
import { Task } from "../../App";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { TaskStackParamList, RootStackParamList } from "../../navigation/types";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTasks } from "../../services/get-user-tasks";
import { useUser } from "../../lib/auth-config";
import { mapApiItemToTask } from "../../utils/transformations/task-transform";

type TasksPageNavigationProp = StackNavigationProp<
  TaskStackParamList & RootStackParamList,
  "TasksList"
>;

interface TasksPageProps {
  tasks: Task[];
  appState: any;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  profileImage: string | null;
  setActiveSection: React.Dispatch<React.SetStateAction<string>>;
}

const TABS = ["Pending", "Completed", "Accepted", "Rejected"];

// Enhanced TaskCard Component
const EnhancedTaskCard: React.FC<{
  task: Task;
  onSelectTask: (task: Task) => void;
}> = ({ task, onSelectTask }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "accepted":
        return "#3B82F6";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#DC2626";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={enhancedStyles.taskCard}
      onPress={() => onSelectTask(task)}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={enhancedStyles.cardHeader}>
        <View style={enhancedStyles.headerLeft}>
          <Text style={enhancedStyles.taskId}>#{task.taskId}</Text>
          <View
            style={[
              enhancedStyles.statusBadge,
              { backgroundColor: getStatusColor(task.status) + "20" },
            ]}
          >
            <View
              style={[
                enhancedStyles.statusDot,
                { backgroundColor: getStatusColor(task.status) },
              ]}
            />
            <Text
              style={[
                enhancedStyles.statusText,
                { color: getStatusColor(task.status) },
              ]}
            >
              {task.status}
            </Text>
          </View>
        </View>
        {task.priority && (
          <View
            style={[
              enhancedStyles.priorityBadge,
              { backgroundColor: getPriorityColor(task.priority) },
            ]}
          >
            <Text style={enhancedStyles.priorityText}>
              {task.priority.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Task Type */}
      {task.taskType && (
        <View style={enhancedStyles.taskTypeContainer}>
          <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
          <Text style={enhancedStyles.taskType}>{task.taskType}</Text>
        </View>
      )}

      {/* Factory & Stage Info */}
      <View style={enhancedStyles.infoRow}>
        <View style={enhancedStyles.infoItem}>
          <Ionicons name="business-outline" size={16} color="#6B7280" />
          <View style={enhancedStyles.infoTextContainer}>
            <Text style={enhancedStyles.infoLabel}>Factory</Text>
            <Text style={enhancedStyles.infoValue}>
              {task.factory || "N/A"}
            </Text>
          </View>
        </View>
        {task.stageName && (
          <View style={enhancedStyles.infoItem}>
            <Ionicons name="layers-outline" size={16} color="#6B7280" />
            <View style={enhancedStyles.infoTextContainer}>
              <Text style={enhancedStyles.infoLabel}>Stage</Text>
              <Text style={enhancedStyles.infoValue}>{task.stageName}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Due Date & Order ID */}
      <View style={enhancedStyles.footerRow}>
        <View style={enhancedStyles.footerItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={enhancedStyles.footerText}>
            Due: {formatDate(task.dueDate)}
          </Text>
        </View>
        <View style={enhancedStyles.footerItem}>
          <Ionicons name="document-text-outline" size={14} color="#6B7280" />
          <Text style={enhancedStyles.footerText}>Order: {task.orderId}</Text>
        </View>
      </View>

      {/* Arrow Indicator */}
      <View style={enhancedStyles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const TasksPage: React.FC<TasksPageProps> = ({
  appState,
  searchQuery,
  setSearchQuery,
  profileImage,
  setActiveSection,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TasksPageNavigationProp>();
  const route = useRoute<any>();
  const { data: userData } = useUser();
  const userId = userData?.user?._id;
  const token = userData?.token;

  const selectedStatus = appState.activeSection;

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["tasks", userId, selectedStatus],
    queryFn: () =>
      fetchUserTasks({
        userObjId: userId,
        status: selectedStatus,
      }),
    enabled: !!token,
  });

  useEffect(() => {
    const autoTab = route.params?.autoSelectTab;
    if (autoTab) {
      setActiveSection(autoTab);
      setSearchQuery("");
      refetch();
    }
  }, [route.params?.autoSelectTab]);

  const rawTasks = data?.data ?? [];
  const mappedTasks: Task[] = rawTasks.map((item: any) =>
    mapApiItemToTask(item)
  );

  const updatedTasks: Task[] = mappedTasks.filter((t) =>
    [t.orderId, t.taskId, t.factory].some((v) =>
      v?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSelectTask = (task: Task) => {
    navigation.navigate("TaskDetail", { task });
  };

  const handleProfilePress = () => {
    navigation.navigate("ProfileModal", {
      user: appState.user,
      profileImage,
    });
  };

  return (
    <View style={[{ paddingTop: insets.top, flex: 1 }, styles.safeArea]}>
      <StatusBar barStyle="dark-content" />

      {/* ENHANCED HEADER */}
      <View style={enhancedStyles.header}>
        <View>
          <Text style={enhancedStyles.headerTitle}>Tasks</Text>
          <Text style={enhancedStyles.headerSubtitle}>
            {updatedTasks.length} {selectedStatus.toLowerCase()} task
            {updatedTasks.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={enhancedStyles.profileButton}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={enhancedStyles.profileImage}
            />
          ) : (
            <View style={enhancedStyles.profilePlaceholder}>
              <Text style={enhancedStyles.profileText}>
                {appState.user?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ENHANCED TABS */}
      <View style={enhancedStyles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={enhancedStyles.tabsScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveSection(tab);
                setSearchQuery("");
                refetch();
              }}
              style={[
                enhancedStyles.tab,
                selectedStatus === tab && enhancedStyles.activeTab,
              ]}
            >
              <Text
                style={[
                  enhancedStyles.tabText,
                  selectedStatus === tab && enhancedStyles.activeTabText,
                ]}
              >
                {tab}
              </Text>
              {selectedStatus === tab && <View style={enhancedStyles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ENHANCED SEARCH & LIST */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={enhancedStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* ENHANCED SEARCH */}
        <View style={enhancedStyles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={enhancedStyles.searchInput}
            placeholder="Search by Order ID, Task ID, or Factory"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* TASK LIST */}
        <View style={enhancedStyles.taskList}>
          {updatedTasks.length > 0 ? (
            updatedTasks.map((task) => (
              <EnhancedTaskCard
                key={task.taskId}
                task={task}
                onSelectTask={handleSelectTask}
              />
            ))
          ) : (
            <View style={enhancedStyles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
              <Text style={enhancedStyles.emptyStateTitle}>No tasks found</Text>
              <Text style={enhancedStyles.emptyStateText}>
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : `No ${selectedStatus.toLowerCase()} tasks at the moment`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const enhancedStyles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Tabs Styles
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -12,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },

  // Search Styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    marginLeft: 12,
    padding: 0,
  },

  // Scroll Content
  scrollContent: {
    paddingBottom: 24,
  },

  // Task List
  taskList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Task Card Styles
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  taskId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  taskTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  taskType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  arrowContainer: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});

export default TasksPage;