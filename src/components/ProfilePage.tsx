// components/ProfilePage.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles as globalStyles, ColorConstants } from "../AppStyles";
import { User } from "../App";
import { RootStackScreenProps } from "../navigation/types";
import authService from "../services/authService";
import { useLogout } from "../lib/auth-config";

type ProfilePageNavigationProps = RootStackScreenProps<"ProfileModal">;

interface ProfilePageProps extends ProfilePageNavigationProps {
  user: User;
  profileImage: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  onGoBack: () => void;
  setAppState: (newState: {
    user: User | null;
    view: "login" | "tasks";
  }) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  profileImage,
  setProfileImage,
  onGoBack,
  setAppState,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editableName, setEditableName] = useState<string>(user?.name || "");
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: mediaLibraryStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync();
        if (mediaLibraryStatus !== "granted" || cameraStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable camera and media library permissions in your phone settings to set a profile picture."
          );
        }
      }
    })();
  }, []);

  const handleSaveName = () => {
    user.name = editableName;
    setIsEditingName(false);
    console.log("Name Updated", `Your new name is: ${editableName}`);
  };

  const handleProfileImagePicker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const { mutateAsync: logout } = useLogout();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);

            try {
              await logout({});

              // Clear app state and navigate to login
              setAppState({ user: null, view: "login" });
              console.log("qpowowowowow");

              Alert.alert("Success", "You have been logged out successfully");
            } catch (error: any) {
              // Even if API fails, clear local state
              setAppState({ user: null, view: "login" });

              console.error("Logout error:", error);
              Alert.alert(
                "Logged Out",
                error.message || "You have been logged out"
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleNotificationsPress = () => {
    navigation.navigate("NotificationsModal");
  };

  return (
    <View
      style={[
        { paddingTop: insets.top, flex: 1 },
        globalStyles.profileSafeArea,
      ]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header Bar */}
      <View style={globalStyles.profileHeader}>
        <Text style={globalStyles.profileTitle}>Profile</Text>
        <TouchableOpacity onPress={onGoBack} disabled={loggingOut}>
          <Ionicons name="close" size={24} color={ColorConstants.darkText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={globalStyles.profileScrollView}>
        <View style={globalStyles.profileContent}>
          {/* Avatar Section */}
          <TouchableOpacity
            style={globalStyles.profileAvatarContainer}
            onPress={handleProfileImagePicker}
            disabled={loggingOut}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={globalStyles.profileAvatarImage}
              />
            ) : (
              <Ionicons
                name="mail"
                size={70}
                color={ColorConstants.primaryAccent}
              />
            )}
            <View style={globalStyles.cameraIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name & Email Section */}
          {isEditingName ? (
            <View style={globalStyles.nameEditContainer}>
              <TextInput
                style={globalStyles.profileNameInput}
                value={editableName}
                onChangeText={setEditableName}
                autoFocus
                onBlur={handleSaveName}
                editable={!loggingOut}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                style={globalStyles.nameEditIcon}
                disabled={loggingOut}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={ColorConstants.primaryAccent}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={globalStyles.nameDisplayContainer}>
              <Text style={globalStyles.profileName}>{user.name}</Text>
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={globalStyles.nameEditIcon}
                disabled={loggingOut}
              >
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={ColorConstants.faintText}
                />
              </TouchableOpacity>
            </View>
          )}

          <Text style={globalStyles.profileEmail}>{user.email}</Text>

          {/* Menu Items */}
          <View style={globalStyles.profileMenu}>
            <TouchableOpacity
              style={globalStyles.profileMenuItem}
              onPress={handleNotificationsPress}
              disabled={loggingOut}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={ColorConstants.primaryAccent}
              />
              <Text style={globalStyles.profileMenuItemText}>
                Notifications
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={22}
                color={ColorConstants.mediumText}
              />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[globalStyles.logoutButton, loggingOut && { opacity: 0.6 }]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={globalStyles.logoutButtonText}>Log Out</Text>
            )}
          </TouchableOpacity>

          {/* Version Text */}
          <Text style={globalStyles.versionText}>Version 2.1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfilePage;
