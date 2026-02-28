/**
 * Authentication & Authorization Middleware
 */

import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../services/errorService.js";
import User from "../models/User.js";

/**
 * Verify JWT token and attach user to request
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "No token provided",
        status: 401,
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get full user data from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "User not found",
        status: 401,
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      managedTheatreId: user.managedTheatreId,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
        status: 401,
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid token",
        status: 401,
      });
    }

    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized access",
      status: 401,
    });
  }
};

/**
 * Check if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required",
      status: 401,
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Admin access required",
      status: 403,
    });
  }

  next();
};

/**
 * Check if user has manager role
 */
export const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required",
      status: 401,
    });
  }

  if (req.user.role !== "manager") {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Manager access required",
      status: 403,
    });
  }

  next();
};

/**
 * Check if user has specific role
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication required",
        status: 401,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: `Access requires one of these roles: ${allowedRoles.join(", ")}`,
        status: 403,
      });
    }

    next();
  };
};

/**
 * Optional user verification
 * Doesn't fail if token is missing, but extracts user if present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        managedTheatreId: user.managedTheatreId,
      };
    }

    next();
  } catch (error) {
    // Failed to verify, continue without user
    next();
  }
};

export default {
  verifyToken,
  requireAdmin,
  requireManager,
  requireRole,
  optionalAuth,
};
