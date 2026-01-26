import jwt from "jsonwebtoken";
import User from "../models/User.js";

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

    if (!token) {
      return res.json({ success: false, message: "not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and has manager role
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "manager") {
      return res.json({ success: false, message: "not authorized - manager role required" });
    }

    req.user = { 
      id: decoded.id, 
      role: decoded.role,
      managedTheaterId: user.managedTheaterId
    };
    next();
  } catch (error) {
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
      return res.json({ success: false, message: "not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and has admin role
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "not authorized - admin role required" });
    }

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized" });
  }
};
