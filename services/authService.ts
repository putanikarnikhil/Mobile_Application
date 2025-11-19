// services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log("kol",credentials);
      const response = await api.post<LoginResponse>('/user/login', credentials);
      console.log("kol2");
      
      if (response.data.success && response.data.user) {
        // Store user data in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Note: In React Native, cookies aren't automatically handled like in browsers
        // The backend sets an httpOnly cookie, but for mobile we should use the token
        // You may need to modify your backend to also return a token in the response body
        // For now, we'll store the user data
        
        return response.data;
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Network error. Please try again.');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await api.get<LogoutResponse>('/user/logout');
      console.log(response);
      
      // Clear local storage
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
      
      return response.data;
    } catch (error: any) {
      // Even if the API call fails, clear local data
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Logout failed');
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
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