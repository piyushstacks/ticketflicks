import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import managerRouter from "./routes/managerRoutes.js";
import managerScreenTblRouter from "./routes/managerScreenTblRoutes.js";
import userRouter from "./routes/userRoutes.js";
import theatreRouter from "./routes/theatreRoutes.js";
import { searchTheatres } from "./controllers/theatreController.js";
import { searchMoviesAndShows } from "./controllers/showController.js";
import debugRouter, { requestLogger } from "./routes/debugRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import authRouter from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();

// Stripe Webhooks Route (must be before express.json() middleware)
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

//Middleware
app.use(requestLogger); // Add request logging
app.use(express.json());
app.use(cors());
// app.use(clerkMiddleware()); // Temporarily disabled for debugging

//API Routes
app.get("/", (req, res) => {
  console.log('Root endpoint called');
  res.send("Server is Live!");
});
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
// Add search route before show router to avoid conflicts
app.get("/api/search/movies", (req, res) => {
  console.log('Movies search route hit directly in server.js');
  searchMoviesAndShows(req, res);
});
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/manager", managerRouter);
app.use("/api/manager", managerScreenTblRouter); // SCREEN_TBL routes
app.use("/api/user", userRouter);
// Add search route before theatre router to avoid conflicts
app.get("/api/search/theatres", (req, res) => {
  console.log('Search route hit directly in server.js');
  searchTheatres(req, res);
});
app.use("/api/theatre", theatreRouter);
// Debug routes (safe: requires DEBUG_EMAIL_SECRET when NODE_ENV=production)
app.use("/api/debug", debugRouter);

app.listen(PORT, () =>
  console.log(`Server listening at http://localhost:${PORT}`)
);

