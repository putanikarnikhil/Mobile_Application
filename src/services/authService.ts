// services/authService.ts
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger, consoleTransport } from "react-native-logs";

var log = logger.createLogger({
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  severity: "debug",
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    },
  },
  async: true,
  dateFormat: "time",
  printLevel: true,
  printDate: true,
  fixedExtLvlLength: false,
  enabled: true,
});

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  profilePhoto?: string;
  organisation: string;
}

export interface LoginResponse {
  message: string;
  user: UserData;
  success: boolean;
}

export interface LogoutResponse {
  message: string;
  success: boolean;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // console.log("kol", credentials);
      const response = await api.post<LoginResponse>(
        "/user/login",
        credentials
      );

      log.debug("User Response: ", response.data);

      if (response.data.success && response.data.user) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user)
        );

        return response.data;
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || "Network error. Please try again.");
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await api.get<LogoutResponse>("/user/logout");
      console.log(response);

      // Clear local storage
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("authToken");

      return response.data;
    } catch (error: any) {
      // Even if the API call fails, clear local data
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("authToken");

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || "Logout failed");
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const userData = await this.getUserData();
    return userData !== null;
  }
}

export default new AuthService();
