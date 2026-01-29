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
  enableTheatre,
  disableTheatre,
  approveTheatre,
  getTheatrePayments,
  getPendingTheatres,
  getAllShows,
  getTheatreScreens,
} from "../controllers/adminController.js";
import {
  syncMoviesFromTMDB,
  getAllAvailableMovies,
  getAllMovies,
  getMovieById,
  deactivateMovie,
  updateMovie,
  assignMoviesToTheatre,
  removeMoviesFromTheatre,
  createMovie,
  excludeTheatresFromMovie,
  includeTheatresForMovie,
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

// Theatre Management Routes
adminRouter.get("/theatres", protectAdminOnly, getAllTheatres);
adminRouter.get("/theatres/pending", protectAdminOnly, getPendingTheatres);
adminRouter.get("/theatres/:theatreId", protectAdminOnly, getTheatreDetails);
adminRouter.get("/theatres/:theatreId/screens", protectAdminOnly, getTheatreScreens);
adminRouter.post("/theatres", protectAdminOnly, createTheatre);
adminRouter.put("/theatres/:theatreId", protectAdminOnly, updateTheatre);
adminRouter.delete("/theatres/:theatreId", protectAdminOnly, deleteTheatre);
adminRouter.put("/theatres/:theatreId/approve", protectAdminOnly, approveTheatre);
adminRouter.put("/theatres/:theatreId/disable", protectAdminOnly, disableTheatre);
adminRouter.put("/theatres/:theatreId/enable", protectAdminOnly, enableTheatre);

// Theatre Payments/Bookings
adminRouter.get("/payments/:theatreId", protectAdminOnly, getTheatrePayments);

// Movie Management Routes
adminRouter.post("/movies/create", protectAdminOnly, createMovie);
adminRouter.post("/movies/sync-tmdb", protectAdminOnly, syncMoviesFromTMDB);
adminRouter.get("/movies", protectAdminOnly, getAllMovies);
adminRouter.get("/movies/available", protectAdminOnly, getAllAvailableMovies);
adminRouter.get("/movies/:movieId", protectAdminOnly, getMovieById);
adminRouter.put("/movies/:movieId/deactivate", protectAdminOnly, deactivateMovie);
adminRouter.put("/movies/:movieId", protectAdminOnly, updateMovie);

// Movie Exclusion Routes
adminRouter.post("/movies/:movieId/exclude-theatres", protectAdminOnly, excludeTheatresFromMovie);
adminRouter.post("/movies/:movieId/include-theatres", protectAdminOnly, includeTheatresForMovie);

// Movie-Theatre Assignment Routes
adminRouter.post("/theatres/:theatreId/assign-movies", protectAdminOnly, assignMoviesToTheatre);
adminRouter.post("/theatres/:theatreId/remove-movies", protectAdminOnly, removeMoviesFromTheatre);

export default adminRouter;
