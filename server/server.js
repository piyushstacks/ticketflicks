import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

import debugRouter, { requestLogger } from "./routes/debugRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import authRouter from "./routes/authRoutes.js";
import newSchemaRouter from "./routes/newSchemaRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import managerRouter from "./routes/managerRoutes.js";
import theatreRouter from "./routes/theatreRoutes.js";
import userRouter from "./routes/userRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();

// Stripe Webhooks Route (must be before express.json() middleware)
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Middleware
app.use(requestLogger); // Add request logging
app.use(express.json());
app.use(cors());
// app.use(clerkMiddleware()); // Temporarily disabled for debugging

// API Routes - NEW SCHEMA IS NOW DEFAULT
app.get("/", (req, res) => {
  console.log('Root endpoint called');
  res.json({
    success: true,
    message: "Server is Live! Using New Schema API v2 as default",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);

// NEW SCHEMA ROUTES - Mounted at standard API paths (default)
app.use("/api/show", newSchemaRouter);    // Shows, Movies
app.use("/api/booking", bookingRouter);   // Booking routes (create, seats, confirm, cancel)
app.use("/api/user", userRouter);         // User routes (profile, bookings, feedback, auth)
app.use("/api/theatre", theatreRouter);   // Theatres
app.use("/api/search", searchRouter);     // Search (dedicated router)

// Dedicated admin and manager routes with proper middleware
app.use("/api/admin", adminRouter);  // Admin operations
app.use("/api/manager", managerRouter);  // Manager operations

// Also mount at /api/v2 for backward compatibility during transition
app.use("/api/v2", newSchemaRouter);

// Debug routes
app.use("/api/debug", debugRouter);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`)
);

