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
  Dimensions,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { AuthStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import { useLogin } from "../lib/auth-config";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const CustomColorConstants = {
  primaryAccent: "#2155e5",
  primaryLight: "#4A7BF7",
  primaryDark: "#1A3FB8",
  danger: "#FF3B30",
  success: "#34C759",
  mediumText: "#6C7A89",
  faintText: "#A8B2BD",
  darkText: "#1C2833",
  surface: "#FFFFFF",
  backgroundLight: "#F8F9FB",
  inputBorder: "#E1E8ED",
  shadow: "#000000",
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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const emailFocusAnim = useRef(new Animated.Value(0)).current;
  const passwordFocusAnim = useRef(new Animated.Value(0)).current;
  const cardEntryAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  const scrollViewRef = useRef<ScrollView>(null);

  const { mutateAsync: login } = useLogin();

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(cardEntryAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onLoginPress = async () => {
    if (!validateForm()) return;

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
        Alert.alert("Success", "Welcome back! You're now logged in.");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Please check your credentials and try again.");
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
    errorMessage?: string,
    icon?: string
  ) => {
    const [focused, setFocused] = useState(false);

    const labelStyle = {
      top: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 4] }),
      fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
      color: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [CustomColorConstants.faintText, CustomColorConstants.primaryAccent],
      }),
    };

    const onFocus = () => {
      setFocused(true);
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }).start();
      
      // Scroll to make button visible when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    };

    const onBlur = () => {
      setFocused(false);
      if (value === "") {
        Animated.spring(anim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }).start();
      }
    };

    return (
      <View style={styles.inputGroupContainer}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              top: labelStyle.top,
              fontSize: labelStyle.fontSize,
              color: errorMessage
                ? CustomColorConstants.danger
                : focused
                ? CustomColorConstants.primaryAccent
                : CustomColorConstants.faintText,
            },
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
              borderWidth: focused ? 2 : 1.5,
              backgroundColor: focused ? "#F8FAFF" : CustomColorConstants.surface,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon as any}
              size={22}
              color={
                errorMessage
                  ? CustomColorConstants.danger
                  : focused
                  ? CustomColorConstants.primaryAccent
                  : CustomColorConstants.mediumText
              }
              style={styles.inputIcon}
            />
          )}

          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (errors.email || errors.password) {
                setErrors({});
              }
            }}
            secureTextEntry={isPassword && !isPasswordVisible}
            onFocus={onFocus}
            onBlur={onBlur}
            autoCapitalize="none"
            editable={!loading}
            keyboardType={isPassword ? "default" : "email-address"}
            placeholderTextColor={CustomColorConstants.faintText}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsPasswordVisible((p) => !p)}
              style={styles.passwordToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color={CustomColorConstants.mediumText}
              />
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle"
              size={14}
              color={CustomColorConstants.danger}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    );
  };

  const cardTransform = {
    opacity: cardEntryAnim,
    transform: [
      {
        translateY: cardEntryAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  const logoTransform = {
    opacity: logoAnim,
    transform: [
      {
        scale: logoAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Background gradient decoration */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.View style={[styles.loginCard, cardTransform]}>
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            <Animated.View style={[styles.logoContainer, logoTransform]}>
              <View style={styles.logoBg}>
                <Image source={logoSource} style={styles.logoImage} />
              </View>
            </Animated.View>

            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.signInText}>
              Sign in to continue to your account
            </Text>

            <View style={styles.formContainer}>
              {renderInput(
                "Email Address",
                email,
                setEmail,
                emailFocusAnim,
                false,
                errors.email,
                "mail-outline"
              )}
              {renderInput(
                "Password",
                password,
                setPassword,
                passwordFocusAnim,
                true,
                errors.password,
                "lock-closed-outline"
              )}

              <TouchableOpacity
                style={styles.forgotPasswordButton}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={onLoginPress}
                  style={[styles.loginButton, loading && styles.disabledButton]}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.loadingText}>Signing in...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="#fff"
                        style={styles.buttonIcon}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Extra padding for keyboard */}
            <View style={{ height: 40 }} />
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
    backgroundColor: CustomColorConstants.backgroundLight,
  },
  backgroundDecoration: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: CustomColorConstants.primaryAccent,
    opacity: 0.06,
  },
  circle1: {
    width: 400,
    height: 400,
    top: -150,
    right: -120,
  },
  circle2: {
    width: 300,
    height: 300,
    bottom: -100,
    left: -100,
  },
  circle3: {
    width: 200,
    height: 200,
    top: "40%",
    right: -80,
    opacity: 0.04,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loginCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: CustomColorConstants.surface,
    borderRadius: 32,
    padding: 36,
    shadowColor: CustomColorConstants.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#F0F5FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: CustomColorConstants.primaryAccent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },
  welcomeText: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    color: CustomColorConstants.darkText,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  signInText: {
    fontSize: 16,
    color: CustomColorConstants.mediumText,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 24,
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
  },
  inputGroupContainer: {
    width: "100%",
    marginBottom: 24,
  },
  floatingLabel: {
    position: "absolute",
    left: 52,
    zIndex: 1,
    backgroundColor: CustomColorConstants.surface,
    paddingHorizontal: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    borderRadius: 16,
    height: 62,
    alignItems: "center",
    paddingHorizontal: 18,
  },
  inputIcon: {
    marginRight: 14,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: CustomColorConstants.darkText,
    fontWeight: "500",
    paddingTop: 8,
  },
  passwordToggle: {
    padding: 10,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    color: CustomColorConstants.danger,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 28,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontWeight: "600",
    color: CustomColorConstants.primaryAccent,
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: CustomColorConstants.primaryAccent,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: CustomColorConstants.primaryAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "600",
  },
});