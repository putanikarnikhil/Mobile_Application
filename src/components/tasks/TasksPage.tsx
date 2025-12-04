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
import TaskCard from "./TasksCard";
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

  // Auto-switch tab when coming back from TaskDetail
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

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileIconContainer}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileIconImage} />
          ) : (
            <Text style={styles.profileIconText}>
              {appState.user?.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={{ height: 55, justifyContent: "center" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
          }}
          style={{
            flexGrow: 0,
            height: 45,
          }}
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
                styles.navItem,
                selectedStatus === tab && styles.activeNavItem,
                { marginRight: 10 },
              ]}
            >
              <Text
                style={[
                  styles.navItemText,
                  selectedStatus === tab && styles.activeNavItemText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* SEARCH & LIST */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* SEARCH */}
        <View style={[styles.searchContainer, { marginTop: 5 }]}>
          <Ionicons
            name="search"
            size={20}
            color={ColorConstants.faintText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID / Task ID / Factory"
            placeholderTextColor={ColorConstants.faintText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* TASK LIST */}
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
            <Text style={styles.noTasksText}>No tasks found.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TasksPage;
