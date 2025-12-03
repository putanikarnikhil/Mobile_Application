// components/tasks/TaskDetailPage.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorConstants } from "../../AppStyles";
import { Task, LocationData } from "../../App";
import { TaskStackScreenProps } from "../../navigation/types";

const { width, height } = Dimensions.get("screen");

type Props = {
  task: Task;
  images: string[];
  setImages: (imgs: string[]) => void;
  comment: string;
  setComment: (c: string) => void;
  onTaskUpdate: (
    id: string,
    status: Task["status"],
    imgs: string[],
    comment: string,
    location?: LocationData
  ) => void; // 👈 VOID, NOT Promise
  onGoBack: () => void;
} & TaskStackScreenProps<"TaskDetail">;

const TaskDetailPage: React.FC<Props> = ({
  task,
  images,
  setImages,
  comment,
  setComment,
  onTaskUpdate,
  onGoBack,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [full, setFull] = useState(false);
  const [index, setIndex] = useState(0);

  const isDone = task.status === "Accepted" || task.status === "Completed" || task.status === "Rejected";

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return setLoadingLoc(false);

      const pos = await Location.getCurrentPositionAsync({});
      const addr = await Location.reverseGeocodeAsync(pos.coords);
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: addr?.[0]?.name || "Unknown Location",
      });
      setLoadingLoc(false);
    })();
  }, []);

  const statusColor: Record<Task["status"], string> = {
    Pending: ColorConstants.primaryAccent,
    Accepted: ColorConstants.warning,
    Rejected: ColorConstants.danger,
    Completed: ColorConstants.success,
    Overdue: ColorConstants.danger,
  };

  const handlePhoto = async () => {
    if (!location)
      return Alert.alert(
        "Location Required",
        "Enable location for audit verification"
      );

    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setImages([...images, res.assets[0].uri]);
  };

  const submit = (status: Task["status"]) => {
    // 1️⃣ Validation: Completed must have at least 1 photo
    if (status === "Completed" && images.length === 0) {
      return Alert.alert("Missing Photo", "Upload at least 1 inspection photo");
    }

    // 2️⃣ Update task (parent handles backend / state)
    onTaskUpdate(task.id, status, images, comment, location ?? undefined);

    // 3️⃣ Navigate to correct tab
    const parentNav = navigation.getParent(); // RootStack

    const autoSelectTab = status === "Completed" ? "Completed" : "Rejected";

    parentNav?.navigate("MainTabs", {
      screen: "HomeTab",
      params: {
        screen: "TasksList",
        params: { autoSelectTab },
      },
    });
  };

  const renderDetailItem = (
    label: string,
    value: string | number,
    isStatus?: boolean
  ) => (
    <View style={ui.detailRow}>
      <Text style={ui.label}>{label}</Text>
      <Text
        style={[
          ui.value,
          isStatus && {
            backgroundColor: statusColor[value as Task["status"]],
            color: "#fff",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 14,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={ui.container}>
      {/* Header */}
      <View style={[ui.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={ui.headerText}>Audit Task</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={ui.scroll}>
        {/* Task Detail Section */}
        <View style={ui.card}>
          {renderDetailItem("Order ID:", task.orderId)}
          {renderDetailItem("Order Stage ID:", task.orderStageId)}
          {renderDetailItem("Task ID:", task.taskId)}
          {renderDetailItem("Factory Name:", task.factory)}
          {renderDetailItem("Product Name:", task.product)}
          {renderDetailItem("Stage Name:", task.stage)}
          {renderDetailItem("Stage Status:", task.stageStatus, true)}
          {renderDetailItem("Task Type:", task.taskType)}
          {renderDetailItem("Task Status:", task.status, true)}
        </View>

        {/* Photos */}
        <View style={ui.card}>
          <Text style={ui.sectionTitle}>Inspection Photos</Text>

          {!isDone && (
            <TouchableOpacity style={ui.captureBtn} onPress={handlePhoto}>
              <Ionicons
                name="camera-outline"
                size={30}
                color={ColorConstants.primaryAccent}
              />
              <Text style={ui.captureText}>Take Photo</Text>
            </TouchableOpacity>
          )}

          <ScrollView horizontal>
            {images.map((uri, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setIndex(i);
                  setFull(true);
                }}
              >
                <Image source={{ uri }} style={ui.thumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Comments */}
        <View style={ui.card}>
          <Text style={ui.sectionTitle}>Auditor Notes</Text>
          <TextInput
            style={ui.input}
            placeholder="Add comments..."
            multiline
            value={comment}
            onChangeText={setComment}
            editable={!isDone}
          />
        </View>

        {/* Location */}
        {!isDone && (
          <View style={ui.card}>
            <Text style={ui.sectionTitle}>Location Verification</Text>
            {loadingLoc ? (
              <ActivityIndicator />
            ) : location ? (
              <>
                <Text style={ui.loc}>
                  Latitude: {location.latitude.toFixed(4)}
                </Text>
                <Text style={ui.loc}>
                  Longitude: {location.longitude.toFixed(4)}
                </Text>
                <Text style={ui.loc}>📍 {location.address}</Text>
              </>
            ) : (
              <Text style={ui.err}>Location Required!</Text>
            )}
          </View>
        )}

        {/* ACTION BUTTONS */}
        {!isDone && (
          <>
            <TouchableOpacity
              style={ui.rejectBtn}
              onPress={() => submit("Rejected")}
            >
              <Text style={ui.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={ui.submitBtn}
              onPress={() => submit("Completed")}
            >
              <Text style={ui.submitText}>Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* FULLSCREEN IMAGE VIEW */}
      {full && (
        <Modal animationType="fade" transparent>
          <View style={ui.fullscreen}>
            <Image
              source={{ uri: images[index] }}
              style={{ width, height: height * 0.6 }}
              resizeMode="contain"
            />
            <TouchableOpacity style={ui.close} onPress={() => setFull(false)}>
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TaskDetailPage;

/* Styles stay same as your original industrial UI */
const ui = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECEFF4" },
  scroll: { padding: 16, paddingBottom: 80 },
  header: {
    backgroundColor: ColorConstants.primaryAccent,
    height: 110,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    elevation: 5,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 15, fontWeight: "700" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  captureBtn: {
    borderWidth: 1.5,
    borderColor: ColorConstants.primaryAccent,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  captureText: { color: ColorConstants.primaryAccent, marginTop: 6 },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  input: {
    backgroundColor: "#F4F6FA",
    borderRadius: 10,
    padding: 10,
    minHeight: 90,
    fontSize: 14,
  },
  loc: { fontSize: 14, marginBottom: 4 },
  err: { color: ColorConstants.danger, fontWeight: "700" },
  rejectBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ColorConstants.danger,
    marginBottom: 12,
  },
  rejectText: {
    color: ColorConstants.danger,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: ColorConstants.primaryAccent,
    padding: 14,
    borderRadius: 14,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.98)",
    justifyContent: "center",
    alignItems: "center",
  },
  close: { position: "absolute", top: 20, right: 20 },
});
