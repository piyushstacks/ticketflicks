import express from "express";
import { protectAdminOnly } from "../middleware/auth.js";
import {
  fetchAllBookings,
  fetchAllShows,
  fetchAllScreens,
  fetchDashboardData,
  isAdmin,
  dashboardAdminData,
  getAllTheatres,
  getTheatreDetails,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  disableTheatre,
  enableTheatre,
  approveTheatre,
  getTheatrePayments,
  getPendingTheatres,
  getAllShows,
  getTheatreScreens,
  deleteShow,
  toggleShowStatus,
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

// Existing admin routes
adminRouter.get("/is-admin", protectAdminOnly, isAdmin);
adminRouter.get("/dashboard", protectAdminOnly, fetchDashboardData);
adminRouter.get("/dashboard-admin", protectAdminOnly, dashboardAdminData);
adminRouter.get("/all-bookings", protectAdminOnly, fetchAllBookings);
adminRouter.get("/all-screens", protectAdminOnly, fetchAllScreens);
adminRouter.get("/all-shows", protectAdminOnly, getAllShows);
adminRouter.get("/theatres/pending", protectAdminOnly, getPendingTheatres);
adminRouter.get("/all-feedbacks", protectAdminOnly, fetchAllFeedbacks);

// Show Management Routes
adminRouter.delete("/shows/:id", protectAdminOnly, deleteShow);
adminRouter.put("/shows/:id/toggle-status", protectAdminOnly, toggleShowStatus);

// Theatre Management Routes
adminRouter.get("/theatres", protectAdminOnly, getAllTheatres);
adminRouter.get("/theatres/pending", protectAdminOnly, getPendingTheatres);
adminRouter.get("/theatres/:theatreId", protectAdminOnly, getTheatreDetails);
adminRouter.get(
  "/theatres/:theatreId/screens",
  protectAdminOnly,
  getTheatreScreens,
);
adminRouter.post("/theatres", protectAdminOnly, createTheatre);
adminRouter.put("/theatres/:theatreId", protectAdminOnly, updateTheatre);
adminRouter.delete("/theatres/:theatreId", protectAdminOnly, deleteTheatre);
adminRouter.put(
  "/theatres/:theatreId/approve",
  protectAdminOnly,
  approveTheatre,
);
adminRouter.put(
  "/theatres/:theatreId/disable",
  protectAdminOnly,
  disableTheatre,
);
adminRouter.put("/theatres/:theatreId/enable", protectAdminOnly, enableTheatre);

// Theatre Payments/Bookings
adminRouter.get("/payments/:theatreId", protectAdminOnly, getTheatrePayments);

// Movie Management Routes
adminRouter.post("/movies/create", protectAdminOnly, createMovie);
adminRouter.post("/movies/sync-tmdb", protectAdminOnly, syncMoviesFromTMDB);
adminRouter.get("/movies", protectAdminOnly, getAllMovies);
adminRouter.get("/movies/available", protectAdminOnly, getAllAvailableMovies);
adminRouter.get("/movies/:movieId", protectAdminOnly, getMovieById);
adminRouter.put(
  "/movies/:movieId/deactivate",
  protectAdminOnly,
  deactivateMovie,
);
adminRouter.put("/movies/:movieId/activate", protectAdminOnly, activateMovie);
adminRouter.put("/movies/:movieId", protectAdminOnly, updateMovie);

// Movie Review Routes
adminRouter.get("/movies/:movieId/reviews", protectAdminOnly, getMovieReviews);
adminRouter.post("/movies/:movieId/reviews", protectAdminOnly, addMovieReviews);
adminRouter.put(
  "/movies/:movieId/reviews",
  protectAdminOnly,
  updateMovieReviews,
);
adminRouter.delete(
  "/movies/:movieId/reviews",
  protectAdminOnly,
  deleteMovieReview,
);

// Movie Exclusion Routes
adminRouter.post(
  "/movies/:movieId/exclude-theatres",
  protectAdminOnly,
  excludeTheatresFromMovie,
);
adminRouter.post(
  "/movies/:movieId/include-theatres",
  protectAdminOnly,
  includeTheatresForMovie,
);

// Movie-Theatre Assignment Routes
adminRouter.post(
  "/theatres/:theatreId/assign-movies",
  protectAdminOnly,
  assignMoviesToTheatre,
);
adminRouter.post(
  "/theatres/:theatreId/remove-movies",
  protectAdminOnly,
  removeMoviesFromTheatre,
);

export default adminRouter;
