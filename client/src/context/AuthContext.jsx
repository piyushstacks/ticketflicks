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
    try {
      const { data } = await axios.post("/api/user/reset-password", payload);
      return data;
    } catch (error) {
      // Return the error response data if available
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  };

  const requestTheatreRegistrationOtp = async (payload) => {
    try {
      console.log("=== THEATRE OTP REQUEST ===");
      console.log("Request payload:", payload);
      console.log("Email:", payload.email);
      
      const { data } = await axios.post("/api/theatre/request-otp", payload);
      console.log("OTP request response:", data);
      console.log("Response success:", data.success);
      console.log("Response message:", data.message);
      return data;
    } catch (error) {
      console.error("=== THEATRE OTP REQUEST ERROR ===");
      console.error("Error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Return the error response data if available
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  };

  const completeTheatreRegistration = async (payload) => {
    try {
      const { data } = await axios.post("/api/theatre/register", payload);
      return data;
    } catch (error) {
      // Return the error response data if available
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  };

  const getTheatresByManager = async (managerId) => {
    try {
      console.log("=== AUTH CONTEXT THEATRE FETCH ===");
      console.log("Fetching theatres for manager:", managerId);
      console.log("ManagerId type:", typeof managerId);
      console.log("ManagerId value:", managerId.toString());
      
      const headers = getAuthHeaders();
      console.log("Auth headers:", headers);
      console.log("Token available:", !!token);
      
      // First try debug endpoint without auth
      try {
        console.log("Trying debug endpoint first...");
        const debugResponse = await axios.get(`/api/theatre/debug/manager/${managerId}`);
        console.log("Debug endpoint response:", debugResponse.data);
      } catch (debugError) {
        console.error("Debug endpoint failed:", debugError);
      }
      
      const { data } = await axios.get(`/api/theatre/manager/${managerId}`, {
        headers: headers
      });
      console.log("AuthContext: API response:", data);
      console.log("AuthContext: Response success:", data.success);
      console.log("AuthContext: Response theatres:", data.theatres);
      return data;
    } catch (error) {
      console.error("=== AUTH CONTEXT ERROR ===");
      console.error("AuthContext: Error fetching theatres:", error);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      // Return the error response data if available
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  };

  const changePassword = async (payload) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.post("/api/user/change-password", payload, { headers });
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

  const requestSignupOtp = async (payload) => {
    const { data } = await axios.post("/api/user/signup/request-otp", payload);
    return data;
  };

  const completeSignup = async (payload) => {
    const { data } = await axios.post("/api/user/signup/complete", payload);
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
    verifyOtp,
    signup,
    requestSignupOtp,
    completeSignup,
    forgotPassword,
    resetPassword,
    resendForgot,
    changePassword,
    requestTheatreRegistrationOtp,
    completeTheatreRegistration,
    getTheatresByManager,
    logout,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
