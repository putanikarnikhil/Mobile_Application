import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Clipboard,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogout } from "../lib/auth-config";
import { ColorConstants } from "../AppStyles";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

type ProfilePageProps = {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  profileImage: string | null;
  setProfileImage: (img: string | null) => void;
  onGoBack: () => void;
  setAppState: (v: any) => void;
  navigation: any;
};

export default function ProfilePage({
  user,
  profileImage,
  setProfileImage,
  onGoBack,
  setAppState,
  navigation,
}: ProfilePageProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { mutateAsync: logout } = useLogout();
  const initial = user.name.charAt(0).toUpperCase();

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    ImagePicker.requestCameraPermissionsAsync();
    ImagePicker.requestMediaLibraryPermissionsAsync();

    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickImage = async () => {
    Alert.alert("Upload Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const cam = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          });
          if (!cam.canceled) setProfileImage(cam.assets[0]?.uri);
        },
      },
      {
        text: "Choose From Gallery",
        onPress: async () => {
          const gal = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
          });
          if (!gal.canceled) setProfileImage(gal.assets[0]?.uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await logout({});
          setAppState({ user: null, view: "login" });
          setLoading(false);
        },
      },
    ]);
  };

  const copyID = () => {
    Clipboard.setString(user._id);
    Alert.alert("Copied!", "User ID copied to clipboard");
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    iconColor = "#3B82F6",
    iconBg = "#EEF2FF",
    showArrow = true,
    danger = false,
  }: any) => {
    const pressAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={loading}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, danger && { color: "#EF4444" }]}>
              {title}
            </Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
          {showArrow && (
            <Ionicons name="chevron-forward" size={22} color="#CBD5E1" />
          )}
          {loading && danger && (
            <ActivityIndicator color="#EF4444" size="small" />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const InfoCard = ({
    icon,
    label,
    value,
    onPress,
    iconColor = "#3B82F6",
  }: any) => (
    <TouchableOpacity
      style={styles.infoCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View
        style={[
          styles.infoIconContainer,
          { backgroundColor: iconColor + "15" },
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {onPress && (
        <TouchableOpacity onPress={onPress} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={18} color="#3B82F6" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Fixed Back Button */}
      <View style={[styles.fixedBackButton, { top: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrollable Header */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={["#3B82F6", "#2563EB", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            {/* Decorative circles */}
            <View style={styles.headerCircle1} />
            <View style={styles.headerCircle2} />

            {/* Header content */}
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <Text style={styles.headerSubtitle}>Manage your account</Text>
            </View>
          </LinearGradient>

          {/* Avatar - now part of scroll content */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarShadow}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Edit button */}
              <TouchableOpacity onPress={pickImage} style={styles.editButton}>
                <LinearGradient
                  colors={["#3B82F6", "#2563EB"]}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* User name */}
          <Text style={styles.userName}>{user.name}</Text>

          {/* Info Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
            <View style={styles.infoCardsContainer}>
              <InfoCard
                icon="mail"
                label="Email Address"
                value={user.email}
                iconColor="#3B82F6"
              />
              <InfoCard
                icon="finger-print"
                label="User ID"
                value={user._id}
                onPress={copyID}
                iconColor="#8B5CF6"
              />
            </View>
          </View>

          {/* Menu Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <View style={styles.menuContainer}>
              <MenuItem
                icon="notifications"
                title="Notifications"
                subtitle="Manage your notifications"
                onPress={() => navigation.navigate("NotificationsModal")}
                iconColor="#F59E0B"
                iconBg="#FEF3C7"
              />
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.menuContainer}>
              <View style={styles.menuDivider} />
              <MenuItem
                icon="log-out"
                title="Logout"
                subtitle="Sign out of your account"
                onPress={handleLogout}
                iconColor="#EF4444"
                iconBg="#FEE2E2"
                showArrow={false}
                danger
              />
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVersion}>Version 1.1.0</Text>
            <Text style={styles.appCopyright}>© 2025 VERDE</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  fixedBackButton: {
    position: "absolute",
    left: 20,
    zIndex: 1000,
  },
  backButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    height: 200,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    position: "relative",
  },
  headerCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -100,
    right: -80,
  },
  headerCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: -50,
    left: -60,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom:54,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: -65,
    marginBottom: 20,
  },
  avatarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#fff",
  },
  avatarInitial: {
    fontSize: 52,
    fontWeight: "800",
    color: "#3B82F6",
  },
  editButton: {
    position: "absolute",
    bottom: 5,
    right: 0,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#fff",
  },
  editButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  section: {
    paddingTop: 34,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#28abbdff",
    letterSpacing: 1.2,
    marginBottom: 22,
    marginLeft: 4,
  },
  infoCardsContainer: {
    gap: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 82,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  appVersion: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
});