/**
 * Error handling service
 * Standardized error responses and logging
 */

// Standard error codes and status codes
export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: { status: 401, code: "UNAUTHORIZED", message: "Unauthorized access" },
  INVALID_CREDENTIALS: { status: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
  TOKEN_EXPIRED: { status: 401, code: "TOKEN_EXPIRED", message: "Token has expired" },
  
  // Validation errors
  VALIDATION_ERROR: { status: 400, code: "VALIDATION_ERROR", message: "Validation failed" },
  MISSING_REQUIRED_FIELD: { status: 400, code: "MISSING_FIELD", message: "Required field missing" },
  INVALID_EMAIL: { status: 400, code: "INVALID_EMAIL", message: "Invalid email format" },
  INVALID_PHONE: { status: 400, code: "INVALID_PHONE", message: "Invalid phone number" },
  
  // Resource errors
  NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "Resource not found" },
  ALREADY_EXISTS: { status: 409, code: "ALREADY_EXISTS", message: "Resource already exists" },
  
  // Booking errors
  SEATS_UNAVAILABLE: { status: 409, code: "SEATS_UNAVAILABLE", message: "Selected seats are not available" },
  BOOKING_FAILED: { status: 400, code: "BOOKING_FAILED", message: "Booking could not be completed" },
  
  // Payment errors
  PAYMENT_FAILED: { status: 402, code: "PAYMENT_FAILED", message: "Payment processing failed" },
  INVALID_PAYMENT: { status: 400, code: "INVALID_PAYMENT", message: "Invalid payment information" },
  
  // Server errors
  INTERNAL_ERROR: { status: 500, code: "INTERNAL_ERROR", message: "Internal server error" },
  DATABASE_ERROR: { status: 500, code: "DATABASE_ERROR", message: "Database operation failed" },
};

/**
 * Standardized error response
 */
export class AppError extends Error {
  constructor(errorCode = ERROR_CODES.INTERNAL_ERROR, details = {}) {
    super(errorCode.message);
    this.status = errorCode.status;
    this.code = errorCode.code;
    this.message = errorCode.message;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(ERROR_CODES.VALIDATION_ERROR, details);
    this.message = message;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource, details = {}) {
    super(ERROR_CODES.NOT_FOUND, details);
    this.message = `${resource} not found`;
  }
}

/**
 * Already exists error
 */
export class AlreadyExistsError extends AppError {
  constructor(resource, details = {}) {
    super(ERROR_CODES.ALREADY_EXISTS, details);
    this.message = `${resource} already exists`;
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", details = {}) {
    super(ERROR_CODES.UNAUTHORIZED, details);
    this.message = message;
  }
}

/**
 * Format error response
 */
export const formatErrorResponse = (error) => {
  if (error instanceof AppError) {
    return {
      success: false,
      code: error.code,
      message: error.message,
      status: error.status,
    };
  }
  
  // Handle Mongoose validation errors
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: messages[0] || "Validation failed",
      status: 400,
    };
  }
  
  // Handle Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      success: false,
      code: "ALREADY_EXISTS",
      message: `${field} already exists`,
      status: 409,
    };
  }
  
  // Handle Mongoose cast error
  if (error.name === "CastError") {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid ID format",
      status: 400,
    };
  }
  
  // Generic error
  return {
    success: false,
    code: "INTERNAL_ERROR",
    message: error.message || "Internal server error",
    status: 500,
  };
};

/**
 * Log error for debugging
 */
export const logError = (context, error) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    code: error.code || "UNKNOWN",
    stack: error.stack,
  };
  
  console.error(`[${timestamp}][${context}] ${error.message}`, error);
  return errorInfo;
};

/**
 * Safe error handler for async functions
 */
export const handleAsyncError = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      const errorResponse = formatErrorResponse(error);
      const status = errorResponse.status || 500;
      
      logError(req.path, error);
      res.status(status).json(errorResponse);
    }
  };
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  AlreadyExistsError,
  UnauthorizedError,
  ERROR_CODES,
  formatErrorResponse,
  logError,
  handleAsyncError,
};
