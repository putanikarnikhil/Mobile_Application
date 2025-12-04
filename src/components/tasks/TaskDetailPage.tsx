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
  ) => void;
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
  console.log("asd", task);

  const isDone =
    task.status === "Accepted" ||
    task.status === "Completed" ||
    task.status === "Rejected";

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
    Pending: ColorConstants.warning,
    Accepted: ColorConstants.primaryAccent,
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
  console.log("IMG", images);

  const submit = (newStatus: Task["status"]) => {
    if (newStatus === "Completed" && images.length === 0) {
      return Alert.alert("Missing Photo", "Upload at least 1 inspection photo");
    }

    onTaskUpdate(task.id, newStatus, images, comment, location ?? undefined);

    const parentNav = navigation.getParent();
    const autoSelectTab = newStatus === "Completed" ? "Completed" : "Rejected";

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
    badge?: boolean
  ) => (
    <View style={ui.detailRow}>
      <Text style={ui.label}>{label}</Text>
      <Text
        style={[
          ui.value,
          badge && {
            backgroundColor: statusColor[value as Task["status"]],
            color: "#fff",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <View style={ui.container}>
      {/* HEADER */}
      <View style={[ui.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={ui.headerText}>Audit Task</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={ui.scroll}>
        {/* 🔹 Main Task Fields */}
        <View style={ui.card}>
          {renderDetailItem("Order ID", task.orderId)}
          {renderDetailItem("Stage", task.stage)}
          {renderDetailItem("Factory", task.factory)}
          {renderDetailItem("Type", task.taskType)}
          {renderDetailItem("Status", task.status, true)}
        </View>

        {/* 🔍 Debug JSON View */}
        <View style={ui.card}>
          <Text style={ui.sectionTitle}>All Task Data (Debug)</Text>
          {Object.entries(task).map(([key, val]) => (
            <View key={key} style={ui.detailRow}>
              <Text style={ui.label}>{key}:</Text>
              <Text style={[ui.value, { flex: 1 }]}>
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </Text>
            </View>
          ))}
        </View>

        {/*   Photos */}
        <View style={ui.card}>
          <Text style={ui.sectionTitle}>Inspection Photos</Text>

          {!isDone && (
            <TouchableOpacity style={ui.captureBtn} onPress={handlePhoto}>
              <Ionicons
                name="camera-outline"
                size={32}
                color={ColorConstants.primaryAccent}
              />
              <Text style={ui.captureText}>Take Photo</Text>
            </TouchableOpacity>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Display existing photos from task data */}
            {task.photos &&
              task.photos.length > 0 &&
              task.photos.map((uri, i) => (
                <TouchableOpacity
                  key={`task-${i}`}
                  onPress={() => {
                    setIndex(i);
                    setFull(true);
                  }}
                >
                  <Image source={{ uri }} style={ui.thumb} />
                </TouchableOpacity>
              ))}

            {/* Display newly captured photos */}
            {images.map((uri, i) => (
              <TouchableOpacity
                key={`new-${i}`}
                onPress={() => {
                  setIndex((task.photos?.length || 0) + i);
                  setFull(true);
                }}
              >
                <Image source={{ uri }} style={ui.thumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!task.photos?.length && images.length === 0 && (
            <Text
              style={{
                color: ColorConstants.mediumText,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              No photos available
            </Text>
          )}
        </View>

        {/* Comment */}
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

        {/* 📍 Location */}
        {!isDone && (
          <View style={ui.card}>
            <Text style={ui.sectionTitle}>Location Verification</Text>
            {loadingLoc ? (
              <ActivityIndicator />
            ) : location ? (
              <>
                <Text style={ui.loc}>Lat: {location.latitude.toFixed(4)}</Text>
                <Text style={ui.loc}>Lng: {location.longitude.toFixed(4)}</Text>
                <Text style={ui.loc}>📍 {location.address}</Text>
              </>
            ) : (
              <Text style={ui.err}>Location Required</Text>
            )}
          </View>
        )}

        {/* ACTIONS */}
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

      {/* FULLSCREEN IMAGE MODAL */}
      {full && (
        <Modal transparent animationType="fade">
          <View style={ui.fullscreen}>
            <Image
              source={{
                uri: [...(task.photos || []), ...images][index],
              }}
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

/* Updated Modern UI */
const ui = StyleSheet.create({
  container: { flex: 1, backgroundColor: ColorConstants.background },
  scroll: { paddingHorizontal: 15, paddingBottom: 120 },

  header: {
    backgroundColor: ColorConstants.primaryAccent,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    height: 127,
    marginBottom: 23,
  },
  headerText: { color: "#fff", fontSize: 22, fontWeight: "800" },

  card: {
    backgroundColor: ColorConstants.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: ColorConstants.shadow,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: ColorConstants.inputBase,
  },
  label: {
    fontSize: 14,
    color: ColorConstants.mediumText,
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: ColorConstants.darkText,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: ColorConstants.darkText,
  },

  captureBtn: {
    height: 110,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: ColorConstants.primaryAccent,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  captureText: { fontWeight: "600", color: ColorConstants.primaryAccent },

  thumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
  },

  input: {
    backgroundColor: ColorConstants.inputBase,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
    minHeight: 100,
    color: ColorConstants.darkText,
  },

  loc: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  err: { color: ColorConstants.danger, fontWeight: "800" },

  rejectBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: ColorConstants.danger,
    marginBottom: 12,
  },
  rejectText: {
    color: ColorConstants.danger,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },

  submitBtn: {
    backgroundColor: ColorConstants.primaryAccent,
    paddingVertical: 15,
    borderRadius: 14,
    elevation: 6,
  },
  submitText: { color: "#fff", fontWeight: "800", textAlign: "center" },

  fullscreen: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  close: { position: "absolute", top: 30, right: 20 },
});
