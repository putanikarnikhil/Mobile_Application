// components/LoginPage.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { AuthStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { useLogin } from "../lib/auth-config";

const CustomColorConstants = {
  primaryAccent: "#2155e5ff",
  danger: "#e74c3c",
  mediumText: "#7F8C8D",
  faintText: "#BDC3C7",
  darkText: "#2C3E50",
  surface: "#FFFFFF",
  backgroundLight: "#F0F2F5",
  inputBorder: "#D8DEE4",
};

const logoSource = require("../assets/thumbnail_image005.png");

type LoginPageNavigationProps = StackScreenProps<AuthStackParamList, "Login">;

interface User {
  name: string;
  email: string;
  _id?: string;
  role?: string;
  profilePhoto?: string;
  organisation?: string;
}

interface LoginPageProps extends LoginPageNavigationProps {
  setAppState: (newState: {
    user: User | null;
    view: "login" | "tasks";
  }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setAppState }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const backgroundPulseAnim = useRef(new Animated.Value(0)).current;

  const { mutateAsync: login } = useLogin();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulseAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundPulseAnim, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onLoginPress = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const result = await login({ email, password });

      if (result.user) {
        const appUser: User = {
          name: result.user.fullName,
          email: result.user.email,
          _id: result.user._id,
          role: result.user.role,
          profilePhoto: result.user.profilePhoto,
          organisation: result.user.organisation,
        };

        setAppState({ view: "tasks", user: appUser });
        Alert.alert("Success", "Logged in successfully");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: any,
    anim: Animated.Value,
    isPassword?: boolean,
    errorMessage?: string
  ) => {
    const [focused, setFocused] = useState(false);

    const labelStyle = {
      top: anim.interpolate({ inputRange: [0, 1], outputRange: [17, 5] }),
      fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
    };

    const onFocus = () => {
      setFocused(true);
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    };

    const onBlur = () => {
      setFocused(false);
      if (value === "") {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      }
    };

    return (
      <View style={localStyles.inputGroupContainer}>
        <Animated.Text
          style={[
            localStyles.floatingLabel,
            {
              top: labelStyle.top,
              fontSize: labelStyle.fontSize,
              color: errorMessage ? CustomColorConstants.danger : CustomColorConstants.mediumText,
            },
          ]}
        >
          {label}
        </Animated.Text>

        <View
          style={[
            localStyles.inputWrapper,
            {
              borderColor:
                errorMessage ?
                  CustomColorConstants.danger :
                  focused ?
                    CustomColorConstants.primaryAccent :
                    CustomColorConstants.inputBorder,
            },
          ]}
        >
          {!isPassword ? (
            <TextInput
              style={localStyles.textInput}
              value={value}
              onChangeText={setValue}
              secureTextEntry={false}
              onFocus={onFocus}
              onBlur={onBlur}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          ) : (
            <>
              <TextInput
                style={localStyles.textInput}
                value={value}
                onChangeText={setValue}
                secureTextEntry={!isPasswordVisible}
                onFocus={onFocus}
                onBlur={onBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() => setIsPasswordVisible((prev) => !prev)}
                style={localStyles.passwordToggle}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={CustomColorConstants.mediumText}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {errorMessage && <Text style={localStyles.errorText}>{errorMessage}</Text>}
      </View>
    );
  };

  const bg = backgroundPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E0E8EF", "#FAFCFE"],
  });

  return (
    <View style={localStyles.container}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: bg }]} />

      <KeyboardAvoidingView
        style={localStyles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 25,
          }}
        >
          <View style={localStyles.loginCardFallback}>
            <Image source={logoSource} style={localStyles.logoImage} />

            <Text style={localStyles.welcomeText}>Welcome Back</Text>
            <Text style={localStyles.signInText}>Sign in to your account</Text>

            {renderInput("User ID (Email)", email, setEmail, emailFocusAnim, false, errors.email)}
            {renderInput("Password", password, setPassword, passwordFocusAnim, true, errors.password)}

            <TouchableOpacity style={localStyles.forgotPasswordButton}>
              <Text style={localStyles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLoginPress}
              style={[localStyles.loginButton, loading && localStyles.disabledButton]}
              disabled={loading}
            >
              {loading ?
                <ActivityIndicator color="#fff" /> :
                <Text style={localStyles.loginButtonText}>LOGIN</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginPage;

const localStyles = StyleSheet.create({
  container: {  justifyContent: "center", alignItems: "center" },
  keyboardAvoidingContainer: { width: "100%" },
  loginCardFallback: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 8,
  },
  logoImage: { width: 80, height: 80, resizeMode: "contain", marginBottom: 20 },
  welcomeText: { fontSize: 26, fontWeight: "700", marginBottom: 5 },
  signInText: { fontSize: 15, color: "#7F8C8D", marginBottom: 30 },
  inputGroupContainer: { width: "100%", marginBottom: 18 },
  floatingLabel: { position: "absolute", left: 15, backgroundColor: "#fff", paddingHorizontal: 5 },
  inputWrapper: { flexDirection: "row", borderRadius: 8, borderWidth: 1.3, height: 52, alignItems: "center" },
  textInput: { flex: 1, height: "100%", paddingLeft: 15 },
  passwordToggle: { paddingHorizontal: 15, height: "100%", justifyContent: "center" },
  errorText: { color: "#e74c3c", marginTop: 4 },
  forgotPasswordButton: { alignSelf: "flex-end", marginBottom: 25 },
  forgotPasswordText: { fontWeight: "600", color: "#7F8C8D" },
  loginButton: {
    width: "100%", height: 50,
    backgroundColor: "#2155e5ff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  loginButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
});
