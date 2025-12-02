import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLogout } from "../lib/auth-config";
import { ColorConstants } from "../AppStyles";

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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: logout } = useLogout();

  const initial = user.name.charAt(0).toUpperCase();

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!res.canceled) setProfileImage(res.assets[0].uri);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to exit your session?", [
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
    Alert.alert("Copied", "User ID copied successfully!");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <StatusBar barStyle="light-content" />

      {/* Premium Gradient Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onGoBack} style={styles.close}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Avatar Floating */}
      <View style={styles.avatarWrap}>
        <TouchableOpacity onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={styles.editAvatar}>
          <Ionicons name="camera" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={{ marginTop: 60 }} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Card - Profile Info */}
        <View style={styles.card}>
          {/* Editable Name */}
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                autoFocus
                onBlur={() => {
                  user.name = name;
                  setEditing(false);
                }}
              />
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={ColorConstants.primaryAccent}
                onPress={() => {
                  user.name = name;
                  setEditing(false);
                }}
              />
            </View>
          ) : (
            <View style={styles.row}>
              <Ionicons name="person-outline" size={22} color="#6A7280" />
              <Text style={styles.name}>{user.name}</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={20} color="#6A7280" />
              </TouchableOpacity>
            </View>
          )}

          {/* Email */}
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={22} color="#6A7280" />
            <Text style={styles.text}>{user.email}</Text>
          </View>

          {/* User ID */}
          <View style={styles.row}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#6A7280" />
            <Text style={[styles.text, { flex: 1 }]} numberOfLines={1}>
              {user._id}
            </Text>
            <TouchableOpacity onPress={copyID}>
              <Ionicons name="copy-outline" size={20} color={ColorConstants.primaryAccent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menu}
            onPress={() => navigation.navigate("NotificationsModal")}
          >
            <Ionicons name="notifications-outline" size={22} color={ColorConstants.primaryAccent} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.sep} />

          <TouchableOpacity style={styles.menu} onPress={handleLogout} disabled={loading}>
            <Ionicons name="log-out-outline" size={22} color={ColorConstants.danger} />
            <Text style={[styles.menuText, { color: ColorConstants.danger }]}>Logout</Text>
            {loading && <ActivityIndicator color={ColorConstants.danger} size="small" />}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>App Version 2.1.0</Text>
      </ScrollView>
    </View>
  );
}

/* -------------------------------- Styles ------------------------------- */
const styles = StyleSheet.create({
  header: {
    height: 180,
    backgroundColor: ColorConstants.primaryAccent,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  close: { position: "absolute", left: 20, top: 15 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },

  avatarWrap: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    zIndex: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8EBF2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 42, fontWeight: "800", color: ColorConstants.primaryAccent },
  editAvatar: {
    backgroundColor: ColorConstants.primaryAccent,
    padding: 8,
    borderRadius: 20,
    position: "absolute",
    bottom: 5,
    right: -4,
    elevation: 4,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 18,
    elevation: 6,
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },

  name: { flex: 1, fontSize: 19, fontWeight: "700", color: "#111" },
  nameInput: {
    flex: 1,
    fontSize: 19,
    borderBottomWidth: 1.5,
    borderColor: ColorConstants.primaryAccent,
    paddingBottom: 4,
  },
  text: { fontSize: 15, color: "#555" },

  menu: { flexDirection: "row", gap: 20, alignItems: "center", paddingVertical: 14 },
  menuText: { fontSize: 16, flex: 1, color: "#333" },
  sep: { height: 1, backgroundColor: "#eee", marginVertical: 8 },

  version: { textAlign: "center", marginTop: 12, fontSize: 12, opacity: 0.6 },
});
