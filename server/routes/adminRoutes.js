import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import {
  isAdmin,
  fetchDashboardData,
  getAllTheatres,
  getPendingTheatres,
  approveTheatre,
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
import { fetchAllFeedbacks } from "../controllers/feedbackController.js";

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
adminRouter.put(
  "/theatres/:theatreId/approve",
  protectAdmin,
  approveTheatre,
);

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

export default adminRouter;
