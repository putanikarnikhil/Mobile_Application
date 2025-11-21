import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 1. Define the shape of your context
export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  profilePhoto?: string;
  organisation?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

// 2. Create context with default empty values
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// 4. Provider implementation
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restore token & user on app start
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("userData");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.log("Error loading session", e);
      }
      setLoading(false);
    };

    loadSession();
  }, []);

  // Login method
  const login = async (token: string, user: User) => {
    setToken(token);
    setUser(user);
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("userData", JSON.stringify(user));
  };

  // Logout method
  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userData");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Safe hook to use the context anywhere
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
