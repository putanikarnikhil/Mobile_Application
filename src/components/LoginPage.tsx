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
  Keyboard,
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
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const { mutateAsync: login } = useLogin();

useEffect(() => {
  const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
    const keyboardHeight = e.endCoordinates.height;

    Animated.timing(keyboardOffset, {
      toValue: -keyboardHeight / 11.11, // adaptive shift
      duration: 280,
      useNativeDriver: false,
    }).start();
  });

  const hideSub = Keyboard.addListener("keyboardDidHide", () => {
    Animated.timing(keyboardOffset, {
      toValue: 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  });

  return () => {
    showSub.remove();
    hideSub.remove();
  };
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
      <View style={styles.inputGroupContainer}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            { top: labelStyle.top, fontSize: labelStyle.fontSize },
          ]}
        >
          {label}
        </Animated.Text>

        <View
          style={[
            styles.inputWrapper,
            {
              borderColor: errorMessage
                ? CustomColorConstants.danger
                : focused
                ? CustomColorConstants.primaryAccent
                : CustomColorConstants.inputBorder,
            },
          ]}
        >
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={onFocus}
            onBlur={onBlur}
            autoCapitalize="none"
            editable={!loading}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible((p) => !p)}
              style={styles.passwordToggle}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={CustomColorConstants.mediumText}
              />
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.View
          style={[
            styles.loginCard,
            { transform: [{ translateY: keyboardOffset }] },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image source={logoSource} style={styles.logoImage} />

            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.signInText}>Sign in to your account</Text>

            {renderInput("Email", email, setEmail, emailFocusAnim, false, errors.email)}
            {renderInput("Password", password, setPassword, passwordFocusAnim, true, errors.password)}

            <TouchableOpacity style={styles.forgotPasswordButton}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onLoginPress}
              style={[styles.loginButton, loading && styles.disabledButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFCFE",
  },
  keyboardAvoidingContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    elevation: 8,
  },
  logoImage: { width: 90, height: 90, resizeMode: "contain", alignSelf: "center", marginBottom: 20 },
  welcomeText: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  signInText: { fontSize: 15, color: "#7F8C8D", textAlign: "center", marginBottom: 25 },
  inputGroupContainer: { width: "100%", marginBottom: 18 },
  floatingLabel: {
    position: "absolute",
    left: 15,
    color: "#7F8C8D",
    backgroundColor: "#fff",
    paddingHorizontal: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1.2,
    height: 52,
    alignItems: "center",
  },
  textInput: { flex: 1, height: "100%", paddingLeft: 15 },
  passwordToggle: { paddingHorizontal: 15, height: "100%", justifyContent: "center" },
  errorText: { color: CustomColorConstants.danger, fontSize: 12, marginTop: 4 },
  forgotPasswordButton: { alignSelf: "flex-end", marginVertical: 10 },
  forgotPasswordText: { fontWeight: "600", color: "#7F8C8D" },
  loginButton: {
    backgroundColor: CustomColorConstants.primaryAccent,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  disabledButton: { opacity: 0.6 },
});
