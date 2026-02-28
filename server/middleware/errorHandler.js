/**
 * Error handling middleware
 * Catches and formats errors consistently
 */

import { formatErrorResponse, logError } from "../services/errorService.js";

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logError(`${req.method} ${req.path}`, err);

  // Format error response
  const errorResponse = formatErrorResponse(err);
  const status = errorResponse.status || 500;

  res.status(status).json(errorResponse);
};

/**
 * Async route wrapper to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route ${req.path} not found`,
    status: 404,
  });
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
