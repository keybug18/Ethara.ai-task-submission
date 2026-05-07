import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authAPI } from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    if (token) {
      authAPI.me()
        .then(setUser)
        .catch(() => localStorage.removeItem("tf_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem("tf_token", data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const data = await authAPI.signup({ name, email, password });
    localStorage.setItem("tf_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("tf_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
