import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserNew from "../models/User_new.js";

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
    
    // Check if user exists and has manager role
    // Login in the frontend uses the new schema user collection, so we support both.
    const user = (await User.findById(decoded.id)) || (await UserNew.findById(decoded.id));
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
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.json({ success: false, message: "not authorized - admin role required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and has admin role
    // Login in the frontend uses the new schema user collection, so we support both.
    const user = (await UserNew.findById(decoded.id)) || (await User.findById(decoded.id));
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "not authorized - admin role required" });
    }

    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized - admin role required" });
  }
};
