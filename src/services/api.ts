import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "../config/logger-config";

// -----------------------------------------------------
// BACKEND DEPLOYED IN CLOUD
// REPLACE THIS WITH YOUR ACTUAL BACKEND URL:
// Example:
// const API_BASE_URL = 'https://your-backend.onrender.com/api/v1';
// -----------------------------------------------------

// const API_BASE_URL = 'https://verde-backend-zchoo.ondigitalocean.app/api/v1';
// const API_BASE_URL = "https://localhost:8000/api/v1";
//temporary local IP for testing
const API_BASE_URL = "http://192.168.137.45:8000/api/v1";

// -----------------------------------------------------

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    log.info("Sending Token:", token);

    log.info("Request Headers:", config.headers);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired tokens or auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

export default api;
