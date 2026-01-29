import express from "express";

const debugRouter = express.Router();

// Middleware to log all incoming requests
export function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
}

// Test endpoint to verify debug routes work
debugRouter.get("/test", (req, res) => {
  console.log('Debug test endpoint called');
  res.json({ message: "Debug endpoint working" });
});

export default debugRouter;