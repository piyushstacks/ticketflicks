import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import {
  isAdmin,
  fetchDashboardData,
  getAllTheatres,
  getPendingTheatres,
  approveTheatre,
  getAllBookings,
  getAllShows,
  getAllFeedbacks,
  getStatistics,
  getTheatreScreens,
} from "../controllers/adminController.js";
import {
  syncMoviesFromTMDB,
  getAllAvailableMovies,
  getAllMovies,
  getMovieById,
  deactivateMovie,
  activateMovie,
  updateMovie,
  assignMoviesToTheatre,
  removeMoviesFromTheatre,
  createMovie,
  excludeTheatresFromMovie,
  includeTheatresForMovie,
  addMovieReviews,
  updateMovieReviews,
  deleteMovieReview,
  getMovieReviews,
} from "../controllers/adminMovieController.js";

const adminRouter = express.Router();

// Debug: Log all incoming admin requests
adminRouter.use((req, res, next) => {
  console.log("[adminRoutes] Incoming:", req.method, req.url, "Auth:", req.headers.authorization ? "present" : "missing");
  next();
});

// Existing admin routes
adminRouter.get("/is-admin", protectAdmin, isAdmin);
adminRouter.get("/dashboard", protectAdmin, fetchDashboardData);
adminRouter.get("/theatres", protectAdmin, getAllTheatres);
adminRouter.get("/theatres/pending", protectAdmin, getPendingTheatres);
adminRouter.get("/theatres/:theatreId/screens", protectAdmin, getTheatreScreens);
adminRouter.put(
  "/theatres/:theatreId/approve",
  protectAdmin,
  approveTheatre,
);
adminRouter.put("/theatres/:theatreId/disable", protectAdmin, async (req, res) => {
  try {
    const Theatre = (await import("../models/Theatre.js")).default;
    await Theatre.findByIdAndUpdate(req.params.theatreId, { disabled: true });
    res.json({ success: true, message: "Theatre disabled successfully" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
adminRouter.put("/theatres/:theatreId/enable", protectAdmin, async (req, res) => {
  try {
    const Theatre = (await import("../models/Theatre.js")).default;
    await Theatre.findByIdAndUpdate(req.params.theatreId, { disabled: false });
    res.json({ success: true, message: "Theatre enabled successfully" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});
adminRouter.put("/theatres/:theatreId", protectAdmin, async (req, res) => {
  try {
    const Theatre = (await import("../models/Theatre.js")).default;
    const updated = await Theatre.findByIdAndUpdate(req.params.theatreId, req.body, { new: true });
    res.json({ success: true, message: "Theatre updated successfully", theatre: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Movie Management Routes
adminRouter.post("/movies/create", protectAdmin, createMovie);
adminRouter.post("/movies/sync-tmdb", protectAdmin, syncMoviesFromTMDB);
adminRouter.get("/movies", protectAdmin, getAllMovies);
adminRouter.get("/movies/available", protectAdmin, getAllAvailableMovies);
adminRouter.get("/movies/:movieId", protectAdmin, getMovieById);
adminRouter.put(
  "/movies/:movieId/deactivate",
  protectAdmin,
  deactivateMovie,
);
adminRouter.put("/movies/:movieId/activate", protectAdmin, activateMovie);
adminRouter.put("/movies/:movieId", protectAdmin, updateMovie);

// Movie Review Routes
adminRouter.get("/movies/:movieId/reviews", protectAdmin, getMovieReviews);
adminRouter.post("/movies/:movieId/reviews", protectAdmin, addMovieReviews);
adminRouter.put(
  "/movies/:movieId/reviews",
  protectAdmin,
  updateMovieReviews,
);
adminRouter.delete(
  "/movies/:movieId/reviews",
  protectAdmin,
  deleteMovieReview,
);

// Movie Exclusion Routes
adminRouter.post(
  "/movies/:movieId/exclude-theatres",
  protectAdmin,
  excludeTheatresFromMovie,
);
adminRouter.post(
  "/movies/:movieId/include-theatres",
  protectAdmin,
  includeTheatresForMovie,
);

// Movie-Theatre Assignment Routes
adminRouter.post(
  "/theatres/:theatreId/assign-movies",
  protectAdmin,
  assignMoviesToTheatre,
);
adminRouter.post(
  "/theatres/:theatreId/remove-movies",
  protectAdmin,
  removeMoviesFromTheatre,
);

// Feedbacks
adminRouter.get("/feedbacks", protectAdmin, getAllFeedbacks);
adminRouter.get("/all-feedbacks", protectAdmin, getAllFeedbacks);

// All Bookings (admin view)
adminRouter.get("/all-bookings", protectAdmin, getAllBookings);

// All Shows (admin view)
adminRouter.get("/all-shows", protectAdmin, getAllShows);

// Statistics
adminRouter.get("/statistics", protectAdmin, getStatistics);

export default adminRouter;
