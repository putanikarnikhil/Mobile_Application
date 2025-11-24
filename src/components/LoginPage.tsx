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
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { AuthStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import authService from "../services/authService";
import { useAuth } from "../stores/auth-context";
import { useLogin } from "../lib/auth-config";

const CustomColorConstants = {
  primaryBrand: "#2ecc71",
  primaryAccent: "#2155e5ff",
  primaryLighter: "#85c1e9",
  success: "#27ae60",
  warning: "#f39c12",
  danger: "#e74c3c",
  info: "#3498db",
  backgroundLight: "#F0F2F5",
  backgroundMid: "#E0E2E5",
  surface: "#FFFFFF",
  darkText: "#2C3E50",
  mediumText: "#7F8C8D",
  faintText: "#BDC3C7",
  inputBorder: "#D8DEE4",
  gradientStart: "#E0E8EF",
  gradientEnd: "#FAFCFE",
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const backgroundPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulseAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(backgroundPulseAnim, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [backgroundPulseAnim]);

  const handleFocusAnimation = (anim: Animated.Value, isFocused: boolean) => {
    Animated.timing(anim, {
      toValue: isFocused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { mutateAsync: login } = useLogin();

  const onLoginPress = async () => {
    setErrors({});

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
      } else {
        Alert.alert("Login Failed", result.error?.message || "Unknown error");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPasswordPress = () => {
    Alert.alert(
      "Password Reset",
      "A link has been sent to your email to reset your password."
    );
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    anim: Animated.Value,
    isPassword?: boolean,
    errorMessage?: string
  ) => {
    const [localIsFocused, setLocalIsFocused] = useState(false);

    useEffect(() => {
      Animated.timing(anim, {
        toValue: value.length > 0 || localIsFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [value, localIsFocused, anim]);

    const labelStyle = {
      top: anim.interpolate({ inputRange: [0, 1], outputRange: [17, 5] }),
      fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 12] }),
      color: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [
          CustomColorConstants.mediumText,
          CustomColorConstants.primaryAccent,
        ],
      }),
    };

    const handleFocus = () => {
      setLocalIsFocused(true);
      handleFocusAnimation(anim, true);
    };

    const handleBlur = () => {
      setLocalIsFocused(false);
      handleFocusAnimation(anim, false);
    };

    const isActive = value.length > 0 || localIsFocused;
    const hasError = !!errorMessage;

    return (
      <View style={localStyles.inputGroupContainer}>
        <Animated.Text
          style={[
            localStyles.floatingLabel,
            {
              left: 15,
              top: labelStyle.top,
              fontSize: labelStyle.fontSize,
              color: hasError ? CustomColorConstants.danger : labelStyle.color,
              zIndex: 10,
            },
          ]}
        >
          {label}
        </Animated.Text>

        <View
          style={[
            localStyles.inputWrapper,
            {
              borderColor: hasError
                ? CustomColorConstants.danger
                : localIsFocused
                ? CustomColorConstants.primaryAccent
                : CustomColorConstants.inputBorder,
            },
          ]}
        >
          {isPassword ? (
            <>
              <TextInput
                style={[
                  localStyles.textInput,
                  {
                    color: CustomColorConstants.darkText,
                    flex: 1,
                    paddingLeft: 15,
                  },
                ]}
                value={value}
                onChangeText={(text) => {
                  setValue(text);
                  if (errorMessage)
                    setErrors((prev) => ({
                      ...prev,
                      [isPassword ? "password" : "email"]: undefined,
                    }));
                }}
                secureTextEntry={!isPasswordVisible}
                onFocus={handleFocus}
                onBlur={handleBlur}
                keyboardType="default"
                placeholder={!isActive ? label : undefined}
                placeholderTextColor={CustomColorConstants.faintText}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible((prev) => !prev)}
                style={localStyles.passwordToggle}
              >
                <Ionicons
                  name={
                    isPasswordVisible ? "eye-outline" : "lock-closed-outline"
                  }
                  size={20}
                  color={CustomColorConstants.mediumText}
                />
              </TouchableOpacity>
            </>
          ) : (
            <TextInput
              style={[
                localStyles.textInput,
                { color: CustomColorConstants.darkText, paddingLeft: 15 },
              ]}
              value={value}
              onChangeText={(text) => {
                setValue(text);
                if (errorMessage)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={!isActive ? label : undefined}
              placeholderTextColor={CustomColorConstants.faintText}
              editable={!loading}
            />
          )}
        </View>

        {hasError && <Text style={localStyles.errorText}>{errorMessage}</Text>}
      </View>
    );
  };

  const backgroundColorInterpolation = backgroundPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      CustomColorConstants.gradientStart,
      CustomColorConstants.gradientEnd,
    ],
  });

  return (
    <View style={localStyles.container}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: backgroundColorInterpolation },
        ]}
      />

      <KeyboardAvoidingView
        style={localStyles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -200}
      >
        <View style={localStyles.loginCardFallback}>
          <View style={localStyles.logoContainer}>
            <Image source={logoSource} style={localStyles.logoImage} />
          </View>

          <Text
            style={[
              localStyles.welcomeText,
              { color: CustomColorConstants.darkText },
            ]}
          >
            Welcome Back
          </Text>
          <Text
            style={[
              localStyles.signInText,
              { color: CustomColorConstants.mediumText },
            ]}
          >
            Sign in to your account
          </Text>

          {renderInput(
            "User ID (Email)",
            email,
            setEmail,
            emailFocusAnim,
            false,
            errors.email
          )}
          {renderInput(
            "Password",
            password,
            setPassword,
            passwordFocusAnim,
            true,
            errors.password
          )}

          <TouchableOpacity
            onPress={onForgotPasswordPress}
            style={localStyles.forgotPasswordButton}
          >
            <Text
              style={[
                localStyles.forgotPasswordText,
                { color: CustomColorConstants.mediumText },
              ]}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLoginPress}
            style={[
              localStyles.loginButton,
              loading && localStyles.disabledButton,
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color={CustomColorConstants.surface}
                size="small"
              />
            ) : (
              <Text style={localStyles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <Text
            style={[
              localStyles.termsText,
              { color: CustomColorConstants.faintText },
            ]}
          >
            By continuing, you confirm your acceptance of the
            <Text
              style={{
                color: CustomColorConstants.darkText,
                fontWeight: "bold",
              }}
            >
              {" "}
              Platform Terms.
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginPage;

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CustomColorConstants.backgroundLight,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginCardFallback: {
    backgroundColor: CustomColorConstants.surface,
    borderRadius: 20,
    padding: 35,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    alignItems: "center",
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: CustomColorConstants.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    borderWidth: 2,
    borderColor: CustomColorConstants.primaryAccent,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  signInText: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: "center",
  },
  inputGroupContainer: {
    width: "100%",
    marginBottom: 20,
  },
  floatingLabel: {
    position: "absolute",
    paddingHorizontal: 5,
    backgroundColor: CustomColorConstants.surface,
    borderRadius: 5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CustomColorConstants.surface,
    borderWidth: 1.5,
    borderRadius: 8,
    height: 55,
    overflow: "hidden",
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    paddingHorizontal: 10,
  },
  passwordToggle: {
    paddingHorizontal: 15,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: CustomColorConstants.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
  forgotPasswordButton: {
    marginTop: 5,
    marginBottom: 35,
    alignSelf: "flex-end",
    paddingHorizontal: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "none",
  },
  loginButton: {
    backgroundColor: CustomColorConstants.primaryAccent,
    borderRadius: 8,
    height: 55,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    shadowColor: CustomColorConstants.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButtonText: {
    color: CustomColorConstants.surface,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  termsText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
