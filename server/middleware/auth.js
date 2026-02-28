import jwt from "jsonwebtoken";
import User from "../models/User.js";

console.log("[auth.js] Middleware loaded");

export const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.json({ success: false, message: "not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.json({ success: false, message: "not authorized" });
    }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.json({ success: false, message: "not authorized" });
  }
};

export const protectManager = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    console.log("protectManager: authHeader:", authHeader);
    console.log("protectManager: token:", token);

    if (!token) {
      return res.json({ success: false, message: "not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("protectManager: decoded:", decoded);
    
    const user = await User.findById(decoded.id);
    console.log("protectManager: user found:", !!user);
    console.log("protectManager: user role:", user?.role);
    if (!user || user.role !== "manager") {
      return res.json({ success: false, message: "not authorized - manager role required" });
    }

    req.user = { 
      id: decoded.id, 
      role: decoded.role,
      managedTheatreId: user.managedTheatreId
    };
    next();
  } catch (error) {
    console.log("protectManager error:", error.message);
    return res.json({ success: false, message: "not authorized" });
  }
};

export const protectAdminOnly = async (req, res, next) => {
  console.log("[protectAdminOnly] CALLED for", req.method, req.url);
  try {
    const authHeader = req.headers.authorization || "";
    console.log("[protectAdminOnly] authHeader:", authHeader.substring(0, 50) + "...");
    
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      console.log("[protectAdminOnly] No token");
      return res.json({ success: false, message: "not authorized - admin role required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[protectAdminOnly] decoded:", decoded);
    
    // Check if user exists in DB
    const user = await User.findById(decoded.id);
    console.log("[protectAdminOnly] DB user found:", !!user, "role:", user?.role);
    
    if (user && user.role === "admin") {
      console.log("[protectAdminOnly] Auth via DB user");
      req.user = { id: decoded.id, role: user.role };
      return next();
    }
    
    // Fallback: check token role directly
    console.log("[protectAdminOnly] Token role:", decoded.role);
    if (decoded.role === "admin") {
      console.log("[protectAdminOnly] Auth via token role");
      req.user = { id: decoded.id, role: decoded.role };
      return next();
    }
    
    console.log("[protectAdminOnly] DENIED - not admin");
    return res.json({ success: false, message: "not authorized - admin role required", debug: "reached end of middleware" });
  } catch (error) {
    console.log("[protectAdminOnly] ERROR in catch:", error.message);
    return res.json({ success: false, message: "not authorized - admin role required", error: error.message, stage: "catch" });
  }
};
