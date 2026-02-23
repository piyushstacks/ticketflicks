import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLocal = localStorage.getItem("auth");
    const storedSession = sessionStorage.getItem("auth");
    const stored = storedLocal || storedSession;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch {
        localStorage.removeItem("auth");
        sessionStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  const saveAuth = (nextUser, nextToken, remember = true) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");
    if (nextUser && nextToken) {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(
        "auth",
        JSON.stringify({ user: nextUser, token: nextToken })
      );
    }
  };

  const login = async (payload, options = {}) => {
    const { remember = true } = options;
    // Direct password-based login (no OTP required)
    const { data } = await axios.post("/api/user/login", payload);
    if (data.success) {
      saveAuth(data.user, data.token, remember);
    }
    return data;
  };

  const verifyOtp = async (payload, options = {}) => {
    // This function is no longer used (login OTP removed)
    console.warn("[AuthContext] verifyOtp is deprecated - login no longer requires OTP");
    return { success: false, message: "OTP verification not required for login" };
  };

  const forgotPassword = async (payload) => {
    const { data } = await axios.post("/api/user/forgot-password", payload);
    return data;
  };

  const resetPassword = async (payload) => {
    const { data } = await axios.post("/api/user/reset-password", payload);
    return data;
  };

  const changePassword = async (payload) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.post("/api/user/change-password", payload, { headers });
    return data;
  };

  const getTheatresByManager = async (managerId) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.get(`/api/theatre/manager/${managerId}`, { headers });
    return data;
  };

  const resendLogin = async (payload) => {
    // This function is no longer used (login OTP removed)
    console.warn("[AuthContext] resendLogin is deprecated - login no longer requires OTP");
    return { success: false, message: "OTP verification not required for login" };
  };

  const resendForgot = async (payload) => {
    const { data } = await axios.post("/api/user/forgot-password/resend", payload);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await axios.post("/api/user/signup", payload);
    if (data.success) {
      saveAuth(data.user, data.token, true);
    }
    return data;
  };

  const logout = () => {
    saveAuth(null, null);
  };

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const value = {
    user,
    token,
    loading,
    login,
    saveAuth,
    verifyOtp,
    signup,
    logout,
    getAuthHeaders,
    getTheatresByManager,
    forgotPassword,
    resetPassword,
    resendLogin,
    resendForgot,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
