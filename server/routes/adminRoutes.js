import express from "express";
import { protectAdminOnly } from "../middleware/auth.js";
import {
  fetchAllBookings,
  fetchAllShows,
  fetchDashboardData,
  isAdmin,
  dashboardAdminData,
  getAllTheatres,
  getTheatreDetails,
  createTheatre,
  updateTheatre,
  deleteTheatre,
  getTheatrePayments,
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
} from "../controllers/adminMovieController.js";
import { fetchAllFeedbacks } from "../controllers/feedbackController.js";

const adminRouter = express.Router();

// Existing admin routes
adminRouter.get("/is-admin", protectAdminOnly, isAdmin);
adminRouter.get("/dashboard", protectAdminOnly, fetchDashboardData);
adminRouter.get("/all-shows", protectAdminOnly, fetchAllShows);
adminRouter.get("/all-bookings", protectAdminOnly, fetchAllBookings);
adminRouter.get("/all-feedbacks", protectAdminOnly, fetchAllFeedbacks);

// New admin dashboard
adminRouter.get("/dashboard-admin", protectAdminOnly, dashboardAdminData);

// Theatre Management Routes
adminRouter.get("/theatres", protectAdminOnly, getAllTheatres);
adminRouter.get("/theatres/:theatreId", protectAdminOnly, getTheatreDetails);
adminRouter.post("/theatres", protectAdminOnly, createTheatre);
adminRouter.put("/theatres/:theatreId", protectAdminOnly, updateTheatre);
adminRouter.delete("/theatres/:theatreId", protectAdminOnly, deleteTheatre);

// Theatre Payments/Bookings
adminRouter.get("/payments/:theatreId", protectAdminOnly, getTheatrePayments);

// Movie Management Routes
adminRouter.post("/movies/sync-tmdb", protectAdminOnly, syncMoviesFromTMDB);
adminRouter.get("/movies", protectAdminOnly, getAllMovies);
adminRouter.get("/movies/available", protectAdminOnly, getAllAvailableMovies);
adminRouter.get("/movies/:movieId", protectAdminOnly, getMovieById);
adminRouter.put("/movies/:movieId/deactivate", protectAdminOnly, deactivateMovie);
adminRouter.put("/movies/:movieId", protectAdminOnly, updateMovie);

// Movie-Theatre Assignment Routes
adminRouter.post("/theatres/:theatreId/assign-movies", protectAdminOnly, assignMoviesToTheatre);
adminRouter.post("/theatres/:theatreId/remove-movies", protectAdminOnly, removeMoviesFromTheatre);

export default adminRouter;
