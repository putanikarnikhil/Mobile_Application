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
    const a = addr?.[0];

    const formatted =
      `${a?.name || ""}, ` +
      `${a?.street || ""}, ` +
      `${a?.district || ""}, ` +
      `${a?.city || a?.subregion || ""}, ` +
      `${a?.region || ""}, ` +
      `${a?.postalCode || ""}, ` +
      `${a?.country || ""}`
        .replace(/,\s*,/g, ", ")
        .replace(/^,\s*|,\s*$/g, "")
        .trim();

    setLocation({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      address: formatted,
      details: a,
    });

    setLoadingLoc(false);
  })();
}, []);

  const statusConfig: Record<
    Task["status"],
    { color: string; icon: string; label: string }
  > = {
    Pending: {
      color: ColorConstants.warning,
      icon: "time-outline",
      label: "Pending Review",
    },
    Accepted: {
      color: ColorConstants.primaryAccent,
      icon: "checkmark-circle-outline",
      label: "Accepted",
    },
    Rejected: {
      color: ColorConstants.danger,
      icon: "close-circle-outline",
      label: "Rejected",
    },
    Completed: {
      color: ColorConstants.success,
      icon: "checkmark-done-circle-outline",
      label: "Completed",
    },
    Overdue: {
      color: ColorConstants.danger,
      icon: "alert-circle-outline",
      label: "Overdue",
    },
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

  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatFieldValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderInfoCard = (
    icon: string,
    label: string,
    value: string | number,
    iconColor?: string
  ) => (
    <View style={ui.infoCard}>
      <View
        style={[
          ui.iconCircle,
          { backgroundColor: iconColor || ColorConstants.primaryAccent + "20" },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={22}
          color={iconColor || ColorConstants.primaryAccent}
        />
      </View>
      <View style={ui.infoContent}>
        <Text style={ui.infoLabel}>{label}</Text>
        <Text style={ui.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );

  const allPhotos = [...(task.photos || []), ...images];
  const currentStatus = statusConfig[task.status];

  return (
    <View style={ui.container}>
      {/* HEADER */}
      <View style={[ui.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack} style={ui.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={ui.headerCenter}>
          <Text style={ui.headerTitle}>Audit Task Details</Text>
          <Text style={ui.headerSubtitle}>Order #{task.orderId}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={ui.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* STATUS BANNER */}
        <View
          style={[
            ui.statusBanner,
            { backgroundColor: currentStatus.color + "15" },
          ]}
        >
          <View
            style={[ui.statusIcon, { backgroundColor: currentStatus.color }]}
          >
            <Ionicons
              name={currentStatus.icon as any}
              size={28}
              color="#fff"
            />
          </View>
          <View style={ui.statusInfo}>
            <Text style={ui.statusLabel}>Current Status</Text>
            <Text style={[ui.statusValue, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>

        {/* TASK INFORMATION - Grid Layout */}
        <View style={ui.section}>
          <View style={ui.sectionHeader}>
            <Text style={ui.sectionTitle}>Task Information</Text>
            <View style={ui.badge}>
              <Ionicons name="information-circle" size={14} color="#fff" />
            </View>
          </View>
          
          <View style={ui.gridContainer}>
            <View style={ui.gridItem}>
              <View style={[ui.gridIconBox, { backgroundColor: ColorConstants.primaryAccent + "15" }]}>
                <Ionicons name="document-text" size={24} color={ColorConstants.primaryAccent} />
              </View>
              <Text style={ui.gridLabel}>Order ID</Text>
              <Text style={ui.gridValue}>{task.orderId}</Text>
            </View>

            <View style={ui.gridItem}>
              <View style={[ui.gridIconBox, { backgroundColor: "#FF9500" + "15" }]}>
                <Ionicons name="layers" size={24} color="#FF9500" />
              </View>
              <Text style={ui.gridLabel}>Stage</Text>
              <Text style={ui.gridValue}>{task.stage}</Text>
            </View>

            <View style={ui.gridItem}>
              <View style={[ui.gridIconBox, { backgroundColor: "#5856D6" + "15" }]}>
                <Ionicons name="business" size={24} color="#5856D6" />
              </View>
              <Text style={ui.gridLabel}>Factory</Text>
              <Text style={[ui.gridValue, { textAlign: "center" }]} numberOfLines={3}>
  {task.factory}
</Text>

            </View>

            <View style={ui.gridItem}>
              <View style={[ui.gridIconBox, { backgroundColor: "#34C759" + "15" }]}>
                <Ionicons name="briefcase" size={24} color="#34C759" />
              </View>
              <Text style={ui.gridLabel}>Task Type</Text>
              <Text style={ui.gridValue}>{task.taskType}</Text>
            </View>
          </View>
        </View>

        {/* COMPLETE TASK DATA - Professional Table */}
        <View style={ui.section}>
          <View style={ui.sectionHeader}>
            <Text style={ui.sectionTitle}>Complete Task Data</Text>
            <View style={ui.badge}>
              <Text style={ui.badgeText}>{Object.keys(task).length}</Text>
            </View>
          </View>
          <View style={ui.card}>
            <View style={ui.tableHeader}>
              <Text style={ui.tableHeaderText}>Field Name</Text>
              <Text style={[ui.tableHeaderText, { textAlign: 'right' }]}>Value</Text>
            </View>
            {Object.entries(task)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, val], idx) => (
                <View key={key} style={[
                  ui.tableRow,
                  idx % 2 === 0 && ui.tableRowEven
                ]}>
                  <View style={ui.tableCell}>
                    <View style={ui.tableCellIcon}>
                      <View style={ui.fieldDot} />
                    </View>
                    <Text style={ui.tableCellLabel}>{formatFieldName(key)}</Text>
                  </View>
                  <View style={ui.tableCellValue}>
                    <Text style={ui.tableValueText} numberOfLines={2}>
                      {formatFieldValue(val)}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* INSPECTION PHOTOS */}
        <View style={ui.section}>
          <View style={ui.sectionHeader}>
            <Text style={ui.sectionTitle}>Inspection Photos</Text>
            <View style={ui.badge}>
              <Ionicons name="images-outline" size={14} color="#fff" />
              <Text style={ui.badgeText}>{allPhotos.length}</Text>
            </View>
          </View>

          <View style={ui.card}>
            {!isDone && (
              <TouchableOpacity
                style={ui.captureBtn}
                onPress={handlePhoto}
                activeOpacity={0.7}
              >
                <View style={ui.captureBtnContent}>
                  <View style={ui.cameraIconWrapper}>
                    <Ionicons
                      name="camera"
                      size={28}
                      color={ColorConstants.primaryAccent}
                    />
                  </View>
                  <Text style={ui.captureTitle}>Take Inspection Photo</Text>
                  <Text style={ui.captureSubtitle}>
                    Capture evidence for audit trail
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {allPhotos.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={ui.photoScroll}
              >
                {allPhotos.map((uri, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setIndex(i);
                      setFull(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={ui.photoWrapper}>
                      <Image source={{ uri }} style={ui.thumb} />
                      <View style={ui.photoOverlay}>
                        <Ionicons name="expand-outline" size={20} color="#fff" />
                      </View>
                      {i >= (task.photos?.length || 0) && (
                        <View style={ui.newBadge}>
                          <Text style={ui.newBadgeText}>New</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={ui.emptyState}>
                <Ionicons
                  name="images-outline"
                  size={48}
                  color={ColorConstants.mediumText}
                />
                <Text style={ui.emptyText}>No Photos Available</Text>
                <Text style={ui.emptySubtext}>
                  {isDone
                    ? "This task has no photos"
                    : "Tap above to capture inspection photos"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* AUDITOR NOTES */}
        <View style={ui.section}>
          <Text style={ui.sectionTitle}>Auditor Notes</Text>
          <View style={ui.card}>
            <View style={ui.inputWrapper}>
              <Ionicons
                name="create-outline"
                size={20}
                color={ColorConstants.mediumText}
                style={ui.inputIcon}
              />
              <TextInput
                style={[ui.input, isDone && ui.inputDisabled]}
                placeholder="Add detailed comments and observations..."
                placeholderTextColor={ColorConstants.mediumText}
                multiline
                value={comment}
                onChangeText={setComment}
                editable={!isDone}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* LOCATION VERIFICATION */}
        {!isDone && (
          <View style={ui.section}>
            <Text style={ui.sectionTitle}>Location Verification</Text>
            <View style={ui.card}>
{loadingLoc ? (
  <View style={ui.loadingContainer}>
    <ActivityIndicator size="large" color={ColorConstants.primaryAccent} />
    <Text style={ui.loadingText}>Fetching location...</Text>
  </View>
) : location ? (
  <View style={ui.locationContainer}>
    <View style={ui.locationHeader}>
      <Ionicons name="location" size={24} color={ColorConstants.success} />
      <Text style={ui.locationTitle}>Location Captured</Text>
    </View>

    <View style={ui.locationDetails}>
      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>Latitude:</Text>
        <Text style={ui.locationValue}>
          {location.latitude.toFixed(6)}°
        </Text>
      </View>
      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>Longitude:</Text>
        <Text style={ui.locationValue}>
          {location.longitude.toFixed(6)}°
        </Text>
      </View>

      {/* NEW FULL ADDRESS ROW */}
      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>Street:</Text>
        <Text style={ui.locationValue} numberOfLines={1}>
          {location.details?.street || location.details?.name || "N/A"}
        </Text>
      </View>

      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>City:</Text>
        <Text style={ui.locationValue}>
          {location.details?.city || location.details?.subregion || "N/A"}
        </Text>
      </View>

      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>District:</Text>
        <Text style={ui.locationValue}>
          {location.details?.district || "N/A"}
        </Text>
      </View>

      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>State:</Text>
        <Text style={ui.locationValue}>
          {location.details?.region || "N/A"}
        </Text>
      </View>

      <View style={ui.locationRow}>
        <Text style={ui.locationLabel}>Postal Code:</Text>
        <Text style={ui.locationValue}>
          {location.details?.postalCode || "N/A"}
        </Text>
      </View>

      <View style={[ui.locationRow, { borderBottomWidth: 0 }]}>
        <Text style={ui.locationLabel}>Country:</Text>
        <Text style={ui.locationValue}>
          {location.details?.country || "N/A"}
        </Text>
      </View>
    </View>

    {/* FULL ADDRESS FIELD */}
    <View style={{ marginTop: 14 }}>
      <Text style={[ui.locationLabel, { marginBottom: 6 }]}>
        Full Address:
      </Text>
      <Text
        style={[ui.locationValue, { flex: 1 }]}
        numberOfLines={3}
      >
        {location.address}
      </Text>
    </View>
  </View>
) : (
  <View style={ui.errorContainer}>
    <Ionicons name="alert-circle" size={48} color={ColorConstants.danger} />
    <Text style={ui.errorText}>Location Required</Text>
    <Text style={ui.errorSubtext}>
      Enable location services to complete this audit
    </Text>
  </View>
)}

            </View>
          </View>
        )}

        {/* ACTION BUTTONS */}
        {!isDone && (
          <View style={ui.actionSection}>
            <TouchableOpacity
              style={ui.rejectBtn}
              onPress={() => submit("Rejected")}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={22} color={ColorConstants.danger} />
              <Text style={ui.rejectText}>Reject Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={ui.submitBtn}
              onPress={() => submit("Completed")}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={ui.submitText}>Complete & Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* FULLSCREEN IMAGE MODAL */}
      {full && (
        <Modal transparent animationType="fade" onRequestClose={() => setFull(false)}>
          <View style={ui.fullscreen}>
            <View style={ui.fullscreenHeader}>
              <Text style={ui.fullscreenTitle}>
                Photo {index + 1} of {allPhotos.length}
              </Text>
              <TouchableOpacity
                style={ui.closeBtn}
                onPress={() => setFull(false)}
              >
                <Ionicons name="close-circle" size={36} color="#fff" />
              </TouchableOpacity>
            </View>
            <Image
              source={{ uri: allPhotos[index] }}
              style={ui.fullscreenImage}
              resizeMode="contain"
            />
            <View style={ui.fullscreenNav}>
              {index > 0 && (
                <TouchableOpacity
                  style={ui.navBtn}
                  onPress={() => setIndex(index - 1)}
                >
                  <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {index < allPhotos.length - 1 && (
                <TouchableOpacity
                  style={ui.navBtn}
                  onPress={() => setIndex(index + 1)}
                >
                  <Ionicons name="chevron-forward" size={32} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TaskDetailPage;

/* Professional Modern UI Styles */
const ui = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorConstants.background,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },


  

  // HEADER
  header: {
    backgroundColor: ColorConstants.primaryAccent,
    paddingBottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 10,
    shadowColor: ColorConstants.primaryAccent,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    marginBottom: 24,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },

  // STATUS BANNER
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: ColorConstants.inputBorder,
    shadowColor: ColorConstants.shadow,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    color: ColorConstants.mediumText,
    fontWeight: "700",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  // SECTIONS
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: ColorConstants.darkText,
    letterSpacing: 0.4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorConstants.primaryAccent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // GRID LAYOUT FOR TASK INFO
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: ColorConstants.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: ColorConstants.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
  },
  gridIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 12,
    color: ColorConstants.mediumText,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center",
  },
  gridValue: {
    fontSize: 15,
    color: ColorConstants.darkText,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  // CARDS
  card: {
    backgroundColor: ColorConstants.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: ColorConstants.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: ColorConstants.primaryAccent + "12",
    borderRadius: 12,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "800",
    color: ColorConstants.primaryAccent,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  tableRowEven: {
    backgroundColor: ColorConstants.inputBase + "40",
  },
  tableCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  tableCellIcon: {
    marginRight: 10,
  },
  fieldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ColorConstants.primaryAccent,
  },
  tableCellLabel: {
    fontSize: 14,
    color: ColorConstants.darkText,
    fontWeight: "600",
    flex: 1,
  },
  tableCellValue: {
    flex: 1,
    alignItems: "flex-end",
  },
  tableValueText: {
    fontSize: 14,
    color: ColorConstants.darkText,
    fontWeight: "700",
    textAlign: "right",
    letterSpacing: 0.2,
  },

  // PHOTOS
  captureBtn: {
    backgroundColor: ColorConstants.primaryAccent + "10",
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: ColorConstants.primaryAccent,
    borderStyle: "dashed",
    padding: 24,
    marginBottom: 18,
  },
  captureBtnContent: {
    alignItems: "center",
  },
  cameraIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ColorConstants.primaryAccent + "18",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  captureTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: ColorConstants.primaryAccent,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  captureSubtitle: {
    fontSize: 13,
    color: ColorConstants.mediumText,
    fontWeight: "600",
  },

  photoScroll: {
    marginTop: 10,
  },
  photoWrapper: {
    marginRight: 14,
    position: "relative",
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: ColorConstants.inputBorder,
  },
  photoOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  newBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: ColorConstants.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "800",
    color: ColorConstants.mediumText,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 14,
    color: ColorConstants.mediumText,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },

  // INPUT
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  inputIcon: {
    marginTop: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: ColorConstants.inputBase,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: ColorConstants.inputBorder,
    minHeight: 130,
    color: ColorConstants.darkText,
    fontWeight: "500",
    lineHeight: 22,
  },
  inputDisabled: {
    backgroundColor: ColorConstants.inputBase + "70",
    color: ColorConstants.mediumText,
  },

  // LOCATION
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: ColorConstants.mediumText,
    fontWeight: "700",
  },

  locationContainer: {
    padding: 6,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  locationTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: ColorConstants.success,
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  locationDetails: {
    backgroundColor: ColorConstants.inputBase,
    borderRadius: 14,
    padding: 16,
  },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: ColorConstants.inputBorder,
  },
  locationLabel: {
    fontSize: 14,
    color: ColorConstants.mediumText,
    fontWeight: "700",
  },
  locationValue: {
    fontSize: 14,
    color: ColorConstants.darkText,
    fontWeight: "800",
  },

  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 19,
    fontWeight: "900",
    color: ColorConstants.danger,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  errorSubtext: {
    fontSize: 14,
    color: ColorConstants.mediumText,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  // ACTION BUTTONS
  actionSection: {
    marginTop: 12,
    gap: 14,
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: ColorConstants.danger,
    backgroundColor: ColorConstants.danger + "10",
    gap: 10,
  },
  rejectText: {
    color: ColorConstants.danger,
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.5,
  },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ColorConstants.primaryAccent,
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 8,
    shadowColor: ColorConstants.primaryAccent,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    gap: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.5,
  },

  // FULLSCREEN MODAL
  fullscreen: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
  },
  fullscreenHeader: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  fullscreenTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: width,
    height: height * 0.7,
  },
  fullscreenNav: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },


  // INFO CARD STYLES (for renderInfoCard helper)
infoCard: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 14,
  paddingHorizontal: 16,
  backgroundColor: ColorConstants.surface,
  borderRadius: 14,
  marginBottom: 12,
  shadowColor: ColorConstants.shadow,
  shadowOpacity: 0.07,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 3,
  borderWidth: 1,
  borderColor: ColorConstants.inputBorder,
},
iconCircle: {
  width: 46,
  height: 46,
  borderRadius: 23,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 14,
},
infoContent: {
  flex: 1,
},
infoLabel: {
  fontSize: 13,
  fontWeight: "700",
  color: ColorConstants.mediumText,
  marginBottom: 4,
  letterSpacing: 0.3,
},
infoValue: {
  fontSize: 15,
  fontWeight: "900",
  color: ColorConstants.darkText,
},

});