// components/tasks/TaskDetailPage.tsx
import React, { useState, useEffect, useCallback } from "react";
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
  Linking,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ColorConstants } from "../../AppStyles";
import { Task, LocationData } from "../../App";
import { TaskStackScreenProps } from "../../navigation/types";

const { width, height } = Dimensions.get("screen");

type LocationStatus =
  | "idle"
  | "fetching"
  | "success"
  | "permission_denied"
  | "error"
  | "timeout";

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
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationError, setLocationError] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);
  const [full, setFull] = useState(false);
  const [index, setIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const isPending = task.status === "Pending";
  const isCompleted = task.status === "Completed";
  const isAccepted = task.status === "Accepted";
  const isRejected = task.status === "Rejected";

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const fetchLocation = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLocationStatus("fetching");
      setLocationError("");
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationStatus("permission_denied");
        setLocationError("Location permission is required to complete audits");
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Location fetch timeout")), 15000);
      });

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      });

      const pos = await Promise.race([locationPromise, timeoutPromise]);
      const addr = await Location.reverseGeocodeAsync(pos.coords);
      const a = addr?.[0];

      const formatted =
        `${a?.name || ""}, ${a?.street || ""}, ${a?.district || ""}, ${a?.city || a?.subregion || ""
          }, ${a?.region || ""}, ${a?.postalCode || ""}, ${a?.country || ""}`
          .replace(/,\s*,/g, ", ")
          .replace(/^,\s*|,\s*$/g, "")
          .trim() || "Location captured";

      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: formatted,
        details: a,
      });

      setLocationStatus("success");
      setRetryCount(0);
      setLocationError("");

    } catch (error: any) {
      console.error("Location fetch error:", error);

      if (error.message?.includes("timeout")) {
        setLocationStatus("timeout");
        setLocationError("Location fetch timed out. Please ensure GPS is enabled.");
      } else {
        setLocationStatus("error");
        setLocationError("Unable to fetch location. Please check your settings.");
      }
    }
  }, []);

  useEffect(() => {
    if (isPending) {
      fetchLocation();
    }
  }, [isPending]);

  const handleRetryLocation = () => {
    setRetryCount(prev => prev + 1);
    fetchLocation(true);
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  const statusConfig: Record<
    Task["status"],
    { color: string; icon: string; label: string; description: string }
  > = {
    Pending: {
      color: ColorConstants.warning,
      icon: "time-outline",
      label: "Pending Inspection",
      description: "Ready for factory audit",
    },
    Completed: {
      color: "#FF9500",
      icon: "hourglass-outline",
      label: "Awaiting Verification",
      description: "Under review by VERDE team",
    },
    Accepted: {
      color: ColorConstants.success,
      icon: "checkmark-circle-outline",
      label: "Approved",
      description: "Audit completed successfully",
    },
    Rejected: {
      color: ColorConstants.danger,
      icon: "close-circle-outline",
      label: "Rejected",
      description: "Audit did not meet standards",
    },
    Overdue: {
      color: ColorConstants.danger,
      icon: "alert-circle-outline",
      label: "Overdue",
      description: "Past due date",
    },
  };

  const handlePhoto = async () => {
    if (locationStatus !== "success" || !location) {
      Alert.alert(
        "Location Required",
        "Please ensure your location is captured before taking photos.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry Location",
            onPress: handleRetryLocation
          },
        ]
      );
      return;
    }

    // Request camera permissions explicitly for iOS
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();

    if (cameraStatus !== 'granted') {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access in Settings to take photos.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            }
          },
        ]
      );
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!res.canceled) {
      setImages([...images, res.assets[0].uri]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (newStatus: Task["status"]) => {
    if (locationStatus !== "success" || !location) {
      Alert.alert(
        "Location Required",
        "Your location must be captured to complete the audit. Please enable location services and retry.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleRetryLocation },
        ]
      );
      return;
    }

    if (newStatus === "Completed" && images.length === 0) {
      Alert.alert(
        "Photos Required",
        "Please capture at least one inspection photo before submitting."
      );
      return;
    }

    if (newStatus === "Completed" && !comment.trim()) {
      Alert.alert(
        "Comments Required",
        "Please add inspection comments before submitting.",
        [
          { text: "Skip", onPress: () => proceedWithSubmission(newStatus) },
          { text: "Add Comments", style: "cancel" },
        ]
      );
      return;
    }

    proceedWithSubmission(newStatus);
  };

  const proceedWithSubmission = async (newStatus: Task["status"]) => {
    if (!location) return;

    setIsSubmitting(true);

    try {
      await onTaskUpdate(task.id, newStatus, images, comment, location);

      Alert.alert(
        "Success",
        newStatus === "Completed"
          ? "Task submitted successfully! Awaiting verification."
          : "Task rejected successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              const parentNav = navigation.getParent();
              const autoSelectTab = newStatus === "Completed" ? "Completed" : "Rejected";

              parentNav?.navigate("MainTabs", {
                screen: "HomeTab",
                params: {
                  screen: "TasksList",
                  params: { autoSelectTab },
                },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Submission error:", error);
      Alert.alert(
        "Submission Failed",
        error.message || "Unable to submit task. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const allPhotos = [...(task.photos || []), ...images];
  const currentStatus = statusConfig[task.status];

  const renderLocationCard = () => {
    if (locationStatus === "fetching") {
      return (
        <View style={ui.locationContainer}>
          <ActivityIndicator
            size="large"
            color={ColorConstants.primaryAccent}
            style={{ marginBottom: 12 }}
          />
          <Text style={ui.locationTitle}>Fetching Location</Text>
          <Text style={ui.locationSubtitle}>
            Please ensure GPS is enabled...
          </Text>
          {retryCount > 0 && (
            <Text style={ui.retryText}>Attempt {retryCount + 1}</Text>
          )}
        </View>
      );
    }

    if (locationStatus === "success" && location) {
      return (
        <View style={ui.locationContainer}>
          <View style={ui.locationHeader}>
            <View style={ui.successIconWrapper}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={ColorConstants.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.locationTitle}>Location Verified</Text>
              <Text style={ui.locationSubtitle}>Ready for inspection</Text>
            </View>
            <TouchableOpacity
              onPress={handleRetryLocation}
              style={ui.refreshBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={ColorConstants.primaryAccent} />
            </TouchableOpacity>
          </View>

          <View style={ui.locationDetails}>
            <View style={ui.locationRow}>
              <Ionicons name="location" size={16} color={ColorConstants.mediumText} />
              <Text style={ui.locationLabel}>Coordinates:</Text>
              <Text style={ui.locationValue}>
                {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
              </Text>
            </View>
            <View style={[ui.locationRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="navigate" size={16} color={ColorConstants.mediumText} />
              <Text style={ui.locationLabel}>Address:</Text>
              <Text
                style={[ui.locationValue, { flex: 1, textAlign: "right" }]}
                numberOfLines={3}
              >
                {location.address}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (locationStatus === "permission_denied") {
      return (
        <View style={ui.errorContainer}>
          <View style={ui.errorIconWrapper}>
            <Ionicons name="lock-closed" size={40} color={ColorConstants.danger} />
          </View>
          <Text style={ui.errorTitle}>Permission Denied</Text>
          <Text style={ui.errorMessage}>{locationError}</Text>
          <View style={ui.errorActions}>
            <TouchableOpacity
              style={ui.settingsBtn}
              onPress={openSettings}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={18} color="#fff" />
              <Text style={ui.settingsBtnText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ui.retryBtn}
              onPress={handleRetryLocation}
              activeOpacity={0.8}
            >
              <Ionicons name="reload" size={18} color={ColorConstants.primaryAccent} />
              <Text style={ui.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (locationStatus === "timeout" || locationStatus === "error") {
      return (
        <View style={ui.errorContainer}>
          <View style={ui.errorIconWrapper}>
            <Ionicons
              name={locationStatus === "timeout" ? "time-outline" : "warning-outline"}
              size={40}
              color={ColorConstants.warning}
            />
          </View>
          <Text style={ui.errorTitle}>
            {locationStatus === "timeout" ? "Location Timeout" : "Location Error"}
          </Text>
          <Text style={ui.errorMessage}>{locationError}</Text>
          <Text style={ui.errorHint}>
            {locationStatus === "timeout"
              ? "• Turn on GPS/Location\n• Move to better signal area\n• Restart device if needed"
              : "• Check location services\n• Ensure app permissions\n• Try restarting app"}
          </Text>
          <TouchableOpacity
            style={ui.retryBtnLarge}
            onPress={handleRetryLocation}
            activeOpacity={0.8}
          >
            <Ionicons name="reload" size={20} color="#fff" />
            <Text style={ui.retryBtnLargeText}>Retry Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const InfoCard = ({
    icon,
    label,
    value,
    iconColor = ColorConstants.primaryAccent,
  }: any) => (
    <View style={ui.infoCard}>
      <View style={[ui.iconCircle, { backgroundColor: iconColor + "15" }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={ui.infoContent}>
        <Text style={ui.infoLabel}>{label}</Text>
        <Text style={ui.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
    >
      <View style={ui.container}>
        <View style={[ui.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onGoBack} style={ui.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={ui.headerCenter}>
            <Text style={ui.headerTitle}>Audit Details</Text>
            <Text style={ui.headerSubtitle}>#{task.taskId}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={
            ui.scroll
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                size={24}
                color="#fff"
              />
            </View>
            <View style={ui.statusInfo}>
              <Text style={ui.statusLabel}>Current Status</Text>
              <Text style={[ui.statusValue, { color: currentStatus.color }]}>
                {currentStatus.label}
              </Text>
              <Text style={ui.statusDescription}>
                {currentStatus.description}
              </Text>
            </View>
          </View>

          {/* LOCATION VERIFICATION */}
          {isPending && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Location Verification</Text>
                <View style={[
                  ui.statusBadge,
                  {
                    backgroundColor:
                      locationStatus === "success"
                        ? ColorConstants.success + "20"
                        : locationStatus === "fetching"
                          ? ColorConstants.warning + "20"
                          : ColorConstants.danger + "20",
                  },
                ]}>
                  <Text
                    style={[
                      ui.statusBadgeText,
                      {
                        color:
                          locationStatus === "success"
                            ? ColorConstants.success
                            : locationStatus === "fetching"
                              ? ColorConstants.warning
                              : ColorConstants.danger,
                      },
                    ]}
                  >
                    {locationStatus === "success"
                      ? "Ready"
                      : locationStatus === "fetching"
                        ? "Loading"
                        : "Required"}
                  </Text>
                </View>
              </View>
              <View style={ui.card}>{renderLocationCard()}</View>
            </View>
          )}

          {/* TASK INFORMATION */}
          <View style={ui.section}>
            <View style={ui.sectionHeader}>
              <Text style={ui.sectionTitle}>Task Information</Text>
            </View>

            <View style={ui.card}>
              <InfoCard
                icon="document-text"
                label="Order ID"
                value={task.orderId}
                iconColor="#3B82F6"
              />
              <InfoCard
                icon="business"
                label="Factory"
                value={task.factory}
                iconColor="#5856D6"
              />
              <InfoCard
                icon="layers"
                label="Stage"
                value={task.stage}
                iconColor="#FF9500"
              />
              <InfoCard
                icon="briefcase"
                label="Task Type"
                value={task.taskType}
                iconColor="#34C759"
              />
              <InfoCard
                icon="calendar"
                label="Due Date"
                value={formatDate(task.dueDate)}
                iconColor="#FF3B30"
              />
              <View style={ui.infoCard}>
                <View style={[ui.iconCircle, { backgroundColor: task.priority === "High" ? "#FF3B30" + "15" : task.priority === "Medium" ? "#FF9500" + "15" : "#34C759" + "15" }]}>
                  <Ionicons name="flag" size={18} color={task.priority === "High" ? "#FF3B30" : task.priority === "Medium" ? "#FF9500" : "#34C759"} />
                </View>
                <View style={ui.infoContent}>
                  <Text style={ui.infoLabel}>Priority</Text>
                  <Text style={ui.infoValue} numberOfLines={2}>
                    {task.priority}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* PRODUCT DETAILS */}
          {(task.product && task.product !== "N/A") && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Product Details</Text>
              </View>

              <View style={ui.productCard}>
                <View style={ui.productRow}>
                  <Ionicons name="cube-outline" size={18} color="#8B5CF6" />
                  <Text style={ui.productLabel}>Product:</Text>
                  <Text style={ui.productValue}>{task.product}</Text>
                </View>

                {(() => {
                  let orderData = null;

                  if ((task as any).orderStageTrackingObjId?.orderVariantObjId?.orderObjId) {
                    orderData = (task as any).orderStageTrackingObjId.orderVariantObjId.orderObjId;
                  }
                  else if ((task as any).preProductionOrderStageTrackingObjId?.preProductionOrderVariantObjId?.preProductionOrderObjId) {
                    orderData = (task as any).preProductionOrderStageTrackingObjId.preProductionOrderVariantObjId.preProductionOrderObjId;
                  }
                  else if ((task as any).productionOrderStageTrackingObjId?.productionOrderVariantObjId?.productionOrderObjId) {
                    orderData = (task as any).productionOrderStageTrackingObjId.productionOrderVariantObjId.productionOrderObjId;
                  }

                  if (orderData?.productType) {
                    return (
                      <>
                        <View style={ui.productRow}>
                          <Ionicons name="grid-outline" size={18} color="#8B5CF6" />
                          <Text style={ui.productLabel}>Type:</Text>
                          <Text style={ui.productValue}>{orderData.productType || "N/A"}</Text>
                        </View>
                        <View style={ui.productRow}>
                          <Ionicons name="albums-outline" size={18} color="#8B5CF6" />
                          <Text style={ui.productLabel}>Class:</Text>
                          <Text style={ui.productValue}>{orderData.productClass || "N/A"}</Text>
                        </View>
                        <View style={[ui.productRow, { borderBottomWidth: 0 }]}>
                          <Ionicons name="list-outline" size={18} color="#8B5CF6" />
                          <Text style={ui.productLabel}>Subclass:</Text>
                          <Text style={ui.productValue}>{orderData.productSubclass || "N/A"}</Text>
                        </View>
                      </>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
          )}

          {/* TASK INSTRUCTIONS */}
          {isPending && (task as any).taskDescription && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Task Instructions</Text>
              </View>
              <View style={ui.card}>
                <View style={ui.instructionBox}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={ColorConstants.primaryAccent}
                  />
                  <Text style={ui.instructionText}>
                    {(task as any).taskDescription}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* INSPECTION PHOTOS */}
          <View style={ui.section}>
            <View style={ui.sectionHeader}>
              <Text style={ui.sectionTitle}>Inspection Photos</Text>
              <View style={ui.badge}>
                <Ionicons name="images-outline" size={12} color="#fff" />
                <Text style={ui.badgeText}>{allPhotos.length}</Text>
              </View>
            </View>

            <View style={ui.card}>
              {isPending && (
                <TouchableOpacity
                  style={[
                    ui.captureBtn,
                    (locationStatus !== "success" || !location) && ui.captureBtnDisabled,
                  ]}
                  onPress={handlePhoto}
                  activeOpacity={0.7}
                  disabled={locationStatus !== "success" || !location}
                >
                  <View style={ui.captureBtnContent}>
                    <View style={ui.cameraIconWrapper}>
                      <Ionicons
                        name="camera"
                        size={24}
                        color={
                          locationStatus === "success" && location
                            ? ColorConstants.primaryAccent
                            : ColorConstants.mediumText
                        }
                      />
                    </View>
                    <Text style={[
                      ui.captureTitle,
                      (locationStatus !== "success" || !location) && ui.captureDisabledText,
                    ]}>
                      Take Inspection Photo
                    </Text>
                    <Text style={ui.captureSubtitle}>
                      {locationStatus === "success" && location
                        ? "Capture evidence for audit trail"
                        : "Location required before taking photos"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {allPhotos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={ui.photoScroll}
                  contentContainerStyle={ui.photoScrollContent}
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
                          <Ionicons name="expand-outline" size={18} color="#fff" />
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
                    size={40}
                    color={ColorConstants.mediumText}
                  />
                  <Text style={ui.emptyText}>No Photos Available</Text>
                  <Text style={ui.emptySubtext}>
                    {isPending
                      ? "Enable location and tap above to capture"
                      : "This task has no photos"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* COMMENTS */}
          <View style={ui.section}>
            <View style={ui.sectionHeader}>
              <Text style={ui.sectionTitle}>
                {isPending ? "Add Comments" : "Auditor Comments"}
              </Text>
            </View>
            <View style={ui.card}>
              {isPending ? (
                <View style={ui.inputWrapper}>
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={ColorConstants.mediumText}
                    style={ui.inputIcon}
                  />
                  <TextInput
                    style={ui.input}
                    placeholder="Add detailed inspection comments..."
                    placeholderTextColor={ColorConstants.mediumText}
                    multiline
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                  />
                </View>
              ) : (
                <View style={ui.commentsDisplay}>
                  <Ionicons
                    name="chatbox-ellipses"
                    size={20}
                    color={ColorConstants.primaryAccent}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={ui.commentsText}>
                    {task.comments || (task as any).remarks || "No comments provided"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* REJECTION REASON */}
          {isRejected && (task as any).rejectionReason && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Rejection Reason</Text>
              </View>
              <View style={[ui.card, { backgroundColor: ColorConstants.danger + "10" }]}>
                <View style={ui.rejectionBox}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={ColorConstants.danger}
                  />
                  <Text style={ui.rejectionText}>
                    {(task as any).rejectionReason}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* LOCATION - For completed tasks */}
          {!isPending && (task as any).address && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Inspection Location</Text>
              </View>
              <View style={ui.card}>
                <View style={ui.locationDisplay}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={ColorConstants.success}
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={ui.locationDisplayText}>
                    {(task as any).address?.fullAddress || "Location recorded"}
                  </Text>
                  <View style={ui.coordsRow}>
                    <Text style={ui.coordsText}>
                      📍 {(task as any).address?.latitude?.toFixed(6)}°,{" "}
                      {(task as any).address?.longitude?.toFixed(6)}°
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* COMPLETION DETAILS */}
          {isAccepted && (task as any).completedOn && (
            <View style={ui.section}>
              <View style={ui.sectionHeader}>
                <Text style={ui.sectionTitle}>Completion Details</Text>
              </View>
              <View style={ui.card}>
                <InfoCard
                  icon="checkmark-done-circle"
                  label="Completed On"
                  value={formatDate((task as any).completedOn)}
                  iconColor={ColorConstants.success}
                />
                {(task as any).updatedBy && (
                  <InfoCard
                    icon="person"
                    label="Verified By"
                    value={(task as any).updatedBy.fullName}
                    iconColor={ColorConstants.primaryAccent}
                  />
                )}
              </View>
            </View>
          )}

          {/* ACTION BUTTONS */}
          {isPending && (
            <View style={ui.actionSection}>

              <TouchableOpacity
                style={[
                  ui.submitBtn,
                  (locationStatus !== "success" || !location || isSubmitting) && ui.submitBtnDisabled,
                ]}
                onPress={() => submit("Completed")}
                activeOpacity={0.8}
                disabled={locationStatus !== "success" || !location || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={ui.submitText}>Complete & Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* FULLSCREEN IMAGE MODAL */}
        {full && (
          <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setFull(false)}
          >
            <View style={ui.fullscreen}>
              <View style={ui.fullscreenHeader}>
                <Text style={ui.fullscreenTitle}>
                  Photo {index + 1} of {allPhotos.length}
                </Text>
                <TouchableOpacity
                  style={ui.closeBtn}
                  onPress={() => setFull(false)}
                >
                  <Ionicons name="close-circle" size={32} color="#fff" />
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
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                {index < allPhotos.length - 1 && (
                  <TouchableOpacity
                    style={ui.navBtn}
                    onPress={() => setIndex(index + 1)}
                  >
                    <Ionicons name="chevron-forward" size={28} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

// Styles
const ui = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ColorConstants.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: ColorConstants.primaryAccent,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  scroll: {
    paddingBottom: 20,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: ColorConstants.mediumText,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusValue: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  statusDescription: {
    fontSize: 12,
    color: ColorConstants.mediumText,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ColorConstants.darkText,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorConstants.primaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: ColorConstants.mediumText,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: ColorConstants.darkText,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  productLabel: {
    fontSize: 13,
    color: ColorConstants.mediumText,
    minWidth: 70,
  },
  productValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: ColorConstants.darkText,
  },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: ColorConstants.darkText,
  },
  captureBtn: {
    backgroundColor: ColorConstants.primaryAccent + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ColorConstants.primaryAccent + "30",
    borderStyle: "dashed",
  },
  captureBtnDisabled: {
    backgroundColor: ColorConstants.mediumText + "10",
    borderColor: ColorConstants.mediumText + "30",
  },
  captureBtnContent: {
    alignItems: "center",
  },
  cameraIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  captureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ColorConstants.darkText,
    marginBottom: 3,
  },
  captureDisabledText: {
    color: ColorConstants.mediumText,
  },
  captureSubtitle: {
    fontSize: 12,
    color: ColorConstants.mediumText,
  },
  photoScroll: {
    marginTop: 10,
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  photoScrollContent: {
    paddingRight: 14,
  },
  photoWrapper: {
    marginRight: 10,
    position: "relative",
  },
  thumb: {
    width: 100,
    height: 140,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  photoOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: ColorConstants.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: ColorConstants.mediumText,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: ColorConstants.mediumText,
    marginTop: 4,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  inputIcon: {
    marginTop: 10,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: ColorConstants.darkText,
    minHeight: 100,
    maxHeight: 150,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  commentsDisplay: {
    alignItems: "flex-start",
  },
  commentsText: {
    fontSize: 13,
    lineHeight: 19,
    color: ColorConstants.darkText,
  },
  rejectionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: ColorConstants.danger,
    fontWeight: "500",
  },
  locationDisplay: {
    alignItems: "center",
  },
  locationDisplayText: {
    fontSize: 13,
    lineHeight: 19,
    color: ColorConstants.darkText,
    textAlign: "center",
    marginBottom: 10,
  },
  coordsRow: {
    backgroundColor: ColorConstants.success + "10",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  coordsText: {
    fontSize: 11,
    color: ColorConstants.success,
    fontWeight: "600",
  },
  locationContainer: {
    alignItems: "center",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
  },
  successIconWrapper: {
    marginRight: 10,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ColorConstants.darkText,
  },
  locationSubtitle: {
    fontSize: 12,
    color: ColorConstants.mediumText,
    marginTop: 2,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ColorConstants.primaryAccent + "10",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  locationDetails: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    overflow: "hidden",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    gap: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: ColorConstants.mediumText,
    minWidth: 80,
  },
  locationValue: {
    fontSize: 12,
    fontWeight: "600",
    color: ColorConstants.darkText,
  },
  retryText: {
    fontSize: 11,
    color: ColorConstants.mediumText,
    marginTop: 6,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  errorIconWrapper: {
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ColorConstants.darkText,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 13,
    color: ColorConstants.mediumText,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  errorHint: {
    fontSize: 12,
    color: ColorConstants.mediumText,
    textAlign: "left",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  errorActions: {
    flexDirection: "row",
    gap: 10,
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorConstants.primaryAccent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  settingsBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: ColorConstants.primaryAccent,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: ColorConstants.primaryAccent,
  },
  retryBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ColorConstants.primaryAccent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  retryBtnLargeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  actionSection: {
    flexDirection: "column",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: ColorConstants.danger,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "700",
    color: ColorConstants.danger,
  },
  submitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ColorConstants.success,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  submitBtnDisabled: {
    backgroundColor: ColorConstants.mediumText,
    opacity: 0.5,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  fullscreen: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  fullscreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  fullscreenTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  closeBtn: {
    padding: 6,
  },
  fullscreenImage: {
    flex: 1,
    width: width,
  },
  fullscreenNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TaskDetailPage;