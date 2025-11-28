// services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "../config/logger-config";

// LOCAL API URL
const API_BASE_URL = "http://192.168.100.238:8000/api/v1";

export const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);

    log.debug("📦 ASYNC STORAGE DUMP START");
    if (stores.length === 0) {
      log.debug("🫙 Storage is empty");
    }

    stores.forEach(([key, value]) => {
      try {
        const parsedValue = JSON.parse(value ?? "");
        log.debug(`🔹 ${key}:`, parsedValue);
      } catch {
        log.debug(`🔹 ${key}:`, value);
      }
    });

    log.debug("📦 ASYNC STORAGE DUMP END");
  } catch (error) {
    log.error("❌ Error retrieving AsyncStorage:", error);
  }
};

/* Axios Client */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/* Request Interceptor - Attach Token */
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      log.debug("🔑 Token attached to request");
    } else {
      log.debug("⚠ No token found for request");
    }

    return config;
  },
  (error) => {
    log.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

/* Response Interceptor - Auto Logout on 401 */
api.interceptors.response.use(
  (response) => {
    log.debug("✅ API Response:", response.status);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      log.warn("⚠ 401 Unauthorized - Clearing auth data");

      // ✅ Clear all auth data on 401
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userData");

      debugAsyncStorage();

      // ✅ You can also trigger a navigation to login here if needed
      // Example: navigationRef.current?.navigate('Login');
    }

    log.error("❌ API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
