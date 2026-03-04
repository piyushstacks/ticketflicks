import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

import publicRouter from "./routes/publicRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import authRouter from "./routes/authRoutes.js";
import newSchemaRouter from "./routes/newSchemaRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import managerRouter from "./routes/managerRoutes.js";
import theatreRouter from "./routes/theatreRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────────────────────────
await connectDB();

// ── Stripe Webhook (must be before express.json()) ────────────────────────
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// ── Core Middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use(cors());

// Minimal request logger (dev only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ── Health check ─────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "TicketFlicks API is live",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/inngest", serve({ client: inngest, functions }));

// Auth (login, signup, forgot/reset password)
app.use("/api/auth", authRouter);

// Public (unauthenticated read endpoints)
app.use("/api/public", publicRouter);

// Core API — all mounted on the new schema router
app.use("/api/show", newSchemaRouter); // Shows & Movies
app.use("/api/booking", newSchemaRouter); // Bookings
app.use("/api/user", newSchemaRouter); // Users
app.use("/api/theatre", theatreRouter);   // Theatres
app.use("/api/search", searchRouter);    // Search
app.use("/api/admin", adminRouter);     // Admin operations
app.use("/api/manager", managerRouter);   // Manager operations

// ── Error Handling ────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}`));
