import { createContext, useEffect, useState } from "react";
import { api } from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("focusforge-token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("focusforge-token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("focusforge-token", data.token);
    setUser(data.user);
  }

  async function register(username, email, password) {
    const data = await api.post("/auth/register", { username, email, password });
    localStorage.setItem("focusforge-token", data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("focusforge-token");
    setUser(null);
  }

  async function refreshUser() {
    const me = await api.get("/auth/me");
    setUser(me);
    return me;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
