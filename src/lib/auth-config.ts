import { configureAuth } from "react-query-auth";
import authService, {
  LoginCredentials,
  LoginResponse,
  UserData,
} from "../services/authService";

export interface UserResponse {
  user: UserData | null;
  error: Error | null;
}

const authConfig = {
  userFn: async (): Promise<UserResponse> => {
    try {
      const user = await authService.getUserData();
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  },

  loginFn: async (credentials: LoginCredentials): Promise<UserResponse> => {
    try {
      const response: LoginResponse = await authService.login(credentials);

      // response contains: { user, token, success }
      const { user } = response;

      return { user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  },

  registerFn: async (credentials: any): Promise<UserResponse> => {
    try {
      // You can replace this once you build your real register API
      const response = await authService.login(credentials);
      return { user: response.user, error: null };
    } catch (error: any) {
      return { user: null, error };
    }
  },

  logoutFn: async () => {
    try {
      await authService.logout();
      return null;
    } catch (err) {
      return err;
    }
  },
};

export const { useUser, useLogin, useLogout, useRegister, AuthLoader } =
  configureAuth(authConfig);
