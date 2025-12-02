// components/TaskDetailPage.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles as globalStyles, ColorConstants } from "../../AppStyles";
import { Task, LocationData } from "../../App";
import { TaskStackScreenProps } from "../../navigation/types";

const useLocationFetcher = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Location Access Denied",
            "Location access is required to take photos and submit the task. Please enable it in your device settings."
          );
          setLoading(false);
          setLocation(null);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const fetchedAddress = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        const address =
          fetchedAddress && fetchedAddress.length > 0
            ? `${fetchedAddress[0].name}, ${fetchedAddress[0].city}, ${fetchedAddress[0].region}`
            : "Address not found";

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: address,
        });
      } catch (error) {
        setLocation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location, loading };
};

type TaskDetailPageProps = {
  task: Task;
  onGoBack: () => void;
  onTaskUpdate: (
    taskId: string,
    newStatus: Task["status"],
    newImages: string[],
    newComment: string,
    locationData?: LocationData
  ) => void;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
} & TaskStackScreenProps<"TaskDetail">;

const TaskDetailPage: React.FC<TaskDetailPageProps> = ({
  task,
  onGoBack,
  onTaskUpdate,
  images,
  setImages,
  comment,
  setComment,
}) => {
  const insets = useSafeAreaInsets();
  const { location, loading: locationLoading } = useLocationFetcher();
  const isCompletedOrSubmitted =
    task.status === "Completed" || task.status === "Accepted";

  const canPerformAction = !locationLoading && !!location;

  let locationStatusText = "Location Data Unavailable";
  if (locationLoading) {
    locationStatusText = "Fetching Location...";
  } else if (location) {
    locationStatusText = `Location determined.`;
  }

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestCameraPermissionsAsync();
      }
    })();
  }, []);

  const handleCameraUpload = async () => {
    if (!canPerformAction) {
      Alert.alert(
        "Location Required",
        "You must have a current location available to take photos."
      );
      return;
    }

    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos for task submission. Please grant access in your device settings."
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, result.assets[0].uri]);
      console.log("Photo Uploaded:", result.assets[0].uri);
    }
  };

  const handleSubmission = () => {
    if (!canPerformAction) {
      Alert.alert(
        "Location Required",
        "Cannot submit without a valid location."
      );
      return;
    }

    if (images.length === 0) {
      Alert.alert(
        "Error",
        "Please upload at least one photo before submitting."
      );
      return;
    }

    onTaskUpdate(task.id, "Accepted", images, comment, location);
    onGoBack();
  };

  const renderDetailItem = (
    label: string,
    value: string | number,
    isStatus?: boolean
  ) => (
    <View style={detailStyles.dataRow}>
      <Text style={detailStyles.dataLabel}>{label}</Text>
      <Text
        style={[
          detailStyles.dataValue,
          isStatus && globalStyles.detailStatusText,
          isStatus && getStatusBackground(value as Task["status"]),
        ]}
      >
        {value}
      </Text>
    </View>
  );

  const getStatusBackground = (status: Task["status"]) => {
    switch (status) {
      case "Overdue":
      case "Rejected":
        return { backgroundColor: ColorConstants.danger };
      case "Accepted":
        return { backgroundColor: ColorConstants.warning };
      case "Completed":
        return { backgroundColor: ColorConstants.success };
      case "Pending":
      default:
        return { backgroundColor: ColorConstants.primaryAccent };
    }
  };

  const renderAuditedPhotos = (photoArray: string[]) => (
    <View style={globalStyles.detailSection}>
      <Text style={globalStyles.uploadTitle}>Audited Photos</Text>
      <View style={globalStyles.gallery}>
        {photoArray.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={detailStyles.auditedImage}
          />
        ))}
      </View>
    </View>
  );

  const renderAuditedLocation = (submission: Task["submissionData"]) => {
    if (!submission || !submission.location) return null;
    const { location: loc, submittedOn } = submission;
    const submittedDate = submittedOn ? new Date(submittedOn) : new Date();
    const formattedDate = submittedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeAgo = submittedOn
      ? `Audited On: ${formattedDate}`
      : "Audited On: N/A";

    return (
      <View style={globalStyles.detailSection}>
        <View style={globalStyles.locationHeader}>
          <Ionicons
            name="location"
            size={20}
            color={ColorConstants.primaryAccent}
          />
          <Text style={globalStyles.locationTitle}>Audited Location</Text>
        </View>
        <Text style={detailStyles.locationText}>
          <Text style={globalStyles.detailLabel}>Latitude:</Text> {loc.latitude}
          ° N
        </Text>
        <Text style={detailStyles.locationText}>
          <Text style={globalStyles.detailLabel}>Longitude:</Text>{" "}
          {loc.longitude}° W
        </Text>
        <Text style={detailStyles.locationText}>
          <Text style={globalStyles.detailLabel}>Address:</Text> {loc.address}
        </Text>
        <Text style={globalStyles.lastUpdatedText}>{timeAgo}</Text>
      </View>
    );
  };

  const renderAuditedComments = (commentText: string) => (
    <View style={globalStyles.detailSection}>
      <Text style={globalStyles.commentsTitle}>Audited Comments</Text>
      <View style={detailStyles.commentDisplayBox}>
        <Text style={detailStyles.commentText}>{commentText}</Text>
      </View>
    </View>
  );

  return (
    <View
      style={[{ paddingTop: insets.top, flex: 1 }, globalStyles.detailWrapper]}
    >
      {/* Header */}
      <View style={globalStyles.detailHeaderBar}>
        <TouchableOpacity onPress={onGoBack} style={globalStyles.backButton}>
          <Ionicons
            name="arrow-back-outline"
            size={24}
            color={ColorConstants.darkText}
          />
        </TouchableOpacity>
        <Text style={globalStyles.detailScreenTitle}>Task Details</Text>
        <View style={globalStyles.detailPlaceholder} />
      </View>

      <ScrollView style={globalStyles.detailScrollView}>
        <View style={globalStyles.detailSection}>
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

{isCompletedOrSubmitted && task.photos.length > 0 && (
  renderAuditedPhotos(task.photos)
)}

/* Display remarks from backend */
{isCompletedOrSubmitted && task.remarks && (
  <View style={globalStyles.detailSection}>
    <Text style={globalStyles.commentsTitle}>Remarks</Text>
    <View style={detailStyles.commentDisplayBox}>
      <Text style={detailStyles.commentText}>{task.remarks}</Text>
    </View>
  </View>
)}

/* Display map/location */
{isCompletedOrSubmitted && task.address && (
  <View style={globalStyles.detailSection}>
    <View style={globalStyles.locationHeader}>
      <Ionicons
        name="location"
        size={20}
        color={ColorConstants.primaryAccent}
      />
      <Text style={globalStyles.locationTitle}>Audit Location</Text>
    </View>

    <Text style={detailStyles.locationText}>
      Latitude: {task.address.latitude}
    </Text>
    <Text style={detailStyles.locationText}>
      Longitude: {task.address.longitude}
    </Text>
    <Text style={detailStyles.locationText}>
      Address: {task.address.fullAddress}
    </Text>
  </View>
)}

/* Display audited time */
{isCompletedOrSubmitted && task.completedOn && (
  <Text style={globalStyles.lastUpdatedText}>
    Audited On: {new Date(task.completedOn).toLocaleDateString()}
  </Text>
)}


        {!isCompletedOrSubmitted && (
          <>
            <View style={[globalStyles.detailSection, { paddingBottom: 0 }]}>
              <View style={globalStyles.locationHeader}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={20}
                  color={
                    canPerformAction
                      ? ColorConstants.primaryAccent
                      : ColorConstants.danger
                  }
                />
                <Text style={globalStyles.locationTitle}>Location Status</Text>
              </View>
              <Text
                style={[
                  globalStyles.lastUpdatedText,
                  {
                    marginLeft: 30,
                    color: canPerformAction
                      ? ColorConstants.darkText
                      : ColorConstants.danger,
                  },
                ]}
              >
                {locationStatusText}
              </Text>

              {canPerformAction && location && (
                <>
                  <Text style={detailStyles.locationText}>
                    <Text style={globalStyles.detailLabel}>Latitude:</Text>{" "}
                    {location.latitude.toFixed(4)}° N
                  </Text>
                  <Text style={detailStyles.locationText}>
                    <Text style={globalStyles.detailLabel}>Longitude:</Text>{" "}
                    {location.longitude.toFixed(4)}° W
                  </Text>
                  <Text style={detailStyles.locationText}>
                    <Text style={globalStyles.detailLabel}>Address:</Text>{" "}
                    {location.address}
                  </Text>
                </>
              )}

              {!canPerformAction && !locationLoading && (
                <Text
                  style={{
                    marginLeft: 30,
                    fontSize: 12,
                    color: ColorConstants.mediumText,
                  }}
                >
                  Please check if your device location services are enabled.
                </Text>
              )}
            </View>

            <View style={globalStyles.uploadSection}>
              <Text style={globalStyles.uploadTitle}>
                Upload Photos ({images.length} added)
              </Text>

              {/* Camera Upload Button - DISABLED IF NO LOCATION */}
              <TouchableOpacity
                style={[
                  globalStyles.uploadBox,
                  !canPerformAction && globalStyles.disabledInput,
                ]}
                onPress={handleCameraUpload}
                disabled={!canPerformAction}
              >
                <Ionicons
                  name="camera-outline"
                  size={30}
                  color={
                    canPerformAction
                      ? ColorConstants.primaryAccent
                      : ColorConstants.faintText
                  }
                />
                <Text
                  style={[
                    globalStyles.uploadText,
                    !canPerformAction && { color: ColorConstants.faintText },
                  ]}
                >
                  {canPerformAction
                    ? "Tap to Take Photo"
                    : "Location Required to Take Photo"}
                </Text>
              </TouchableOpacity>

              <View style={globalStyles.gallery}>
                {images.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={globalStyles.thumbnailImage}
                  />
                ))}
              </View>
            </View>

            <View style={globalStyles.commentsSection}>
              <Text style={globalStyles.commentsTitle}>Add Comment</Text>
              <TextInput
                style={[
                  globalStyles.commentsInput,
                  !canPerformAction && globalStyles.disabledInput,
                ]}
                value={comment}
                onChangeText={setComment}
                placeholder={
                  canPerformAction
                    ? "Enter comments for this task submission..."
                    : "Location required to enter comments"
                }
                multiline
                editable={canPerformAction}
              />
            </View>
          </>
        )}
      </ScrollView>

      {!isCompletedOrSubmitted && (
        <View style={globalStyles.actionButtons}>
          <TouchableOpacity
            style={[
              globalStyles.rejectButton,
              !canPerformAction && globalStyles.disabledButton,
            ]}
            onPress={() => onTaskUpdate(task.id, "Rejected", images, comment)}
            disabled={!canPerformAction}
          >
            <Text
              style={[
                globalStyles.rejectButtonText,
                !canPerformAction && { opacity: 0.5 },
              ]}
            >
              Reject
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              globalStyles.submitButton,
              (locationLoading || !canPerformAction) &&
                globalStyles.disabledButton,
            ]}
            onPress={handleSubmission}
            disabled={locationLoading || !canPerformAction}
          >
            <Text style={globalStyles.submitButtonText}>
              {locationLoading ? "Getting Location..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TaskDetailPage;

const detailStyles = StyleSheet.create({
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  dataLabel: {
    fontSize: 16,
    color: ColorConstants.darkText,
    fontWeight: "500",
    flex: 1,
  },
  dataValue: {
    fontSize: 16,
    color: ColorConstants.darkText,
    flex: 1,
    textAlign: "right",
  },
  auditedImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ColorConstants.inputBorder,
  },
  locationText: {
    fontSize: 14,
    color: ColorConstants.darkText,
    marginBottom: 5,
    marginLeft: 30,
  },
  commentDisplayBox: {
    padding: 15,
    backgroundColor: ColorConstants.inputBase,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: ColorConstants.primaryLighter,
  },
  commentText: {
    fontSize: 15,
    color: ColorConstants.darkText,
    lineHeight: 22,
  },
});
