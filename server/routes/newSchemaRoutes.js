import express from "express";
import { protectUser } from "../middleware/protectUser.js";
import { protectManager } from "../middleware/auth.js";

// Controllers
import showController from "../controllers/showController.js";
import bookingController from "../controllers/bookingController.js";
import screenController from "../controllers/managerScreenTblController.js";
import movieController from "../controllers/adminMovieController.js"; // admin only
import authController from "../controllers/authController.js";
import {
  getAllUsers,
  checkIsAdmin,
  updateUserProfile,
  getUserProfile,
  fetchFavorites,
  updateFavorite,
} from "../controllers/userController.js";
import seatController from "../controllers/publicScreenTblController.js";
import metadataController from "../controllers/publicController.js";

import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  getAllTheatres,
  getTheatreDetails,
  searchTheatres,
  getPendingTheatres,
  approveTheatre,
} from "../controllers/theatreController.js";

// Import auth controller for password routes
import {
  requestSignupOtp,
  forgotPasswordRequest,
  resetPasswordWithOtp,
  changePassword,
  resendForgotOtp,
} from "../controllers/authController.js";
import { otpRateLimiter } from "../middleware/otpRateLimiter.js";

// Import unified booking controller
import {
  createBooking,
  confirmStripePayment,
  getBookingDetails,
  cancelBooking,
  checkSeatsAvailability,
  calculatePricing,
  getMyBookings,
} from "../controllers/bookingController.js";

const router = express.Router();

// ========== THEATER REGISTRATION (Public) ==========
router.post("/request-otp", requestTheatreRegistrationOtp);
router.post("/register", registerTheatre);

// ========== SHOW ROUTES ==========
router.post("/shows", showController.addShow);
router.get("/shows", showController.fetchShows);
router.get("/shows/all", showController.fetchShows); // Frontend expects /all endpoint
router.get("/shows/:showId", showController.fetchShow);
router.get("/show/:showId", showController.fetchShow); // Alias for /shows/:showId
router.get("/shows/movie/:movieId", showController.fetchShowsByMovie);
router.put("/shows/:showId", showController.updateShow);
router.delete("/shows/:showId", showController.deleteShow);
router.patch("/shows/:showId/status", showController.toggleShowStatus);
router.get("/movies/available", showController.getAvailableMovies);
// Public routes — no auth required
router.get("/upcoming-movies", showController.fetchUpcomingMovies); // Public: list all active movies
router.get("/trailer/:movieId", showController.getMovieTrailer); // Public: get trailer for a movie
// Manager routes — auth required
router.get("/movies/all", protectManager, showController.getAllMoviesForManager); // Manager: all movies with per-theatre toggle
router.patch("/movies/:movieId", protectManager, showController.toggleMovieForTheatre); // Manager: toggle movie
router.post("/shows/repeat-week", protectManager, (req, res, next) => {
  // Forward to managerShowController.repeatShowsForNextWeek via import
  import("../controllers/managerShowController.js").then(m => m.repeatShowsForNextWeek(req, res, next)).catch(next);
});

// ========== BOOKING ROUTES ==========
// Standard paths (when mounted at /api/show)
router.post("/bookings", protectUser, createBooking);
router.get("/bookings/:id", getBookingDetails);
router.post("/bookings/confirm", protectUser, confirmStripePayment);
router.put("/bookings/:id/cancel", protectUser, cancelBooking);
router.get("/bookings/availability/:showId", checkSeatsAvailability);
router.post("/bookings/pricing", calculatePricing);

// ========== BOOKING ALIAS ROUTES (when mounted at /api/booking) ==========
// Frontend SeatLayout.jsx calls these:
router.get("/seats/:showId", checkSeatsAvailability);        // GET /api/booking/seats/:showId
router.post("/seats/:showId", checkSeatsAvailability);       // POST /api/booking/seats/:showId
router.post("/create", protectUser, createBooking);          // POST /api/booking/create
router.get("/my-bookings", protectUser, getMyBookings);      // GET /api/booking/my-bookings
router.put("/:bookingId/cancel", protectUser, cancelBooking); // PUT /api/booking/:id/cancel
router.post("/confirm-stripe", protectUser, confirmStripePayment); // POST /api/booking/confirm-stripe
router.get("/bookings", protectUser, getMyBookings);         // GET /api/booking/bookings (ManagerBookings fallback)

// ========== THEATER ROUTES ==========
router.get("/theaters", getAllTheatres);
router.get("/theaters/search", searchTheatres);
router.get("/theaters/:id", getTheatreDetails);

// ========== SCREEN ROUTES ==========
router.post("/screens", screenController.createScreen);
router.get("/screens", screenController.getAllScreens);
router.get("/screens/theater/:theaterId", screenController.getScreensByTheater);
router.get("/screens/:screenId", screenController.getScreen);
router.put("/screens/:screenId", screenController.updateScreen);
router.delete("/screens/:screenId", screenController.deleteScreen);
router.patch("/screens/:screenId/status", screenController.updateScreenStatus);

// ========== MOVIE ROUTES ==========
router.post("/movies", movieController.createMovie);
router.get("/movies", movieController.getAllMovies);
router.get("/movies/:movieId", movieController.getMovieById);
router.put("/movies/:movieId", movieController.updateMovie);
router.delete("/movies/:movieId", movieController.deleteMovie);
router.get("/movies/search", movieController.searchMovies);
router.get("/movies/tmdb/now-playing", movieController.fetchNowPlayingFromTMDB);
router.post("/movies/tmdb/import/:tmdbId", movieController.importMovieFromTMDB);
// ========== USER ROUTES ==========
// Auth routes (from authController)
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/signup/complete", authController.completeSignupWithOtp);
router.post("/signup/request-otp", requestSignupOtp); // OTP before completing signup

// Password management routes
router.post("/forgot-password", otpRateLimiter(), forgotPasswordRequest);
router.post("/forgot-password/resend", otpRateLimiter(), resendForgotOtp);
router.post("/reset-password", resetPasswordWithOtp);
router.post("/change-password", protectUser, changePassword);

// User profile routes
router.get("/profile", protectUser, getUserProfile);
router.put("/profile", protectUser, updateUserProfile);
router.get("/is-admin", protectUser, checkIsAdmin);

// Favorites routes
router.get("/favorites", protectUser, fetchFavorites);
router.post("/favorites", protectUser, updateFavorite);

// ========== SEAT ROUTES ==========
router.post("/seat-categories", seatController.createSeatCategory);
router.get("/seat-categories", seatController.getAllSeatCategories);
router.post("/seats", seatController.createSeats);
router.get("/seats", seatController.getAllSeats);
router.get("/seats/screen/:screenId", seatController.getSeatsByScreen);
router.put("/seats/:seatId", seatController.updateSeat);
router.delete("/seats/:seatId", seatController.deleteSeat);

// ========== GENRE ROUTES ==========
router.post("/genres", metadataController.createGenre);
router.get("/genres", metadataController.getAllGenres);
router.put("/genres/:genreId", metadataController.updateGenre);
router.delete("/genres/:genreId", metadataController.deleteGenre);

// ========== LANGUAGE ROUTES ==========
router.post("/languages", metadataController.createLanguage);
router.get("/languages", metadataController.getAllLanguages);
router.put("/languages/:languageId", metadataController.updateLanguage);
router.delete("/languages/:languageId", metadataController.deleteLanguage);

// ========== CAST ROUTES ==========
router.post("/cast", metadataController.createCast);
router.get("/cast", metadataController.getAllCast);
router.put("/cast/:castId", metadataController.updateCast);
router.delete("/cast/:castId", metadataController.deleteCast);

// ========== REVIEW ROUTES ==========
// Note: reviewPaymentController doesn't exist - routes commented out
// router.post("/reviews", reviewPaymentController.createReview);
// router.get("/reviews/movie/:movieId", reviewPaymentController.getReviewsByMovie);
// router.get("/reviews/user/:userId", reviewPaymentController.getReviewsByUser);
// router.put("/reviews/:reviewId", reviewPaymentController.updateReview);
// router.delete("/reviews/:reviewId", reviewPaymentController.deleteReview);

// ========== PAYMENT ROUTES ==========
// Note: reviewPaymentController doesn't exist - routes commented out
// router.post("/payments", reviewPaymentController.createPayment);
// router.get("/payments", reviewPaymentController.getAllPayments);
// router.get("/payments/booking/:bookingId", reviewPaymentController.getPaymentByBooking);
// router.get("/payments/transaction/:transactionId", reviewPaymentController.getPaymentByTransactionId);
// router.put("/payments/:paymentId/status", reviewPaymentController.updatePaymentStatus);

export default router;
