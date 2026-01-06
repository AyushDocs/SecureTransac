import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Mock user data for demonstration
const mockUser = {
  id: "1",
  name: "Admin User",
  email: "admin@securetransac.io",
  role: "admin",
  avatar: null,
};

export function AuthProvider({ children }) {
  const [user] = useState(mockUser);
  const [isAdmin] = useState(true);

  const value = {
    user,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
