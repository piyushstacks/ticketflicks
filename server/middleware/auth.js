import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { UnauthorizedError } from "../services/errorService.js";

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Protect routes - requires any authenticated user
 */
export const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Verify user exists in DB
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      code: error.code || "UNAUTHORIZED",
      message: error.message || "Unauthorized",
    });
  }
};

/**
 * Protect admin routes
 */
export const protectAdmin = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (decoded.role !== "admin") {
      throw new UnauthorizedError("Admin access required");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      throw new UnauthorizedError("Admin access required");
    }

    req.user = { id: user._id.toString(), role: "admin" };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      code: error.code || "FORBIDDEN",
      message: error.message || "Admin access required",
    });
  }
};

/**
 * Protect manager routes
 */
export const protectManager = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (decoded.role !== "manager") {
      throw new UnauthorizedError("Manager access required");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "manager") {
      throw new UnauthorizedError("Manager access required");
    }

    req.user = { id: user._id.toString(), role: "manager", managedTheatreId: user.managedTheatreId };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      code: error.code || "FORBIDDEN",
      message: error.message || "Manager access required",
    });
  }
};

/**
 * Protect customer routes
 */
export const protectCustomer = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (decoded.role !== "customer") {
      throw new UnauthorizedError("Customer access required");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== "customer") {
      throw new UnauthorizedError("Customer access required");
    }

    req.user = { id: user._id.toString(), role: "customer" };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      code: error.code || "FORBIDDEN",
      message: error.message || "Customer access required",
    });
  }
};

export default {
  protect,
  protectAdmin,
  protectManager,
  protectCustomer,
  extractToken,
  verifyToken,
};
