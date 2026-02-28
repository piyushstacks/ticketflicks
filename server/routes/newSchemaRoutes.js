import express from "express";
import { protectUser } from "../middleware/protectUser.js";

// Controllers
import showController from "../controllers/showController.js";
import bookingController from "../controllers/bookingController.js";
import screenController from "../controllers/managerScreenTblController.js";
import movieController from "../controllers/adminMovieController.js";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser,
  getAllUsers,
  deleteUser,
  requestSignupOtp,
  completeSignupWithOtp,
  checkIsAdmin,
  getUserFavorites,
  updateUserFavorites,
} from "../controllers/userController.js";
import seatController from "../controllers/publicScreenTblController.js";
import metadataController from "../controllers/publicController.js";

import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  fetchAllTheatres,
  fetchTheatre,
  updateTheatre,
  deleteTheatre,
  getTheatresByManager,
} from "../controllers/theatreController.js";

// Import auth controller for password routes
import {
  forgotPasswordRequest,
  resetPasswordWithOtp,
  changePassword,
  resendForgotOtp,
} from "../controllers/authController.js";
import { otpRateLimiter } from "../middleware/otpRateLimiter.js";

// Import unified booking controller
import {
  createBooking as createBookingStripe,
  fetchOccupiedSeats,
  fetchUserBookings,
  cancelBooking,
  confirmStripePayment,
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
router.get("/upcoming-movies", movieController.getAllMovies); // Frontend expects this
router.get("/trailer/:id", movieController.getMovieById); // Frontend expects this

// ========== BOOKING ROUTES (New Schema) ==========
router.post("/bookings", bookingController.createBooking);
router.get("/bookings/user/:user_id", bookingController.getUserBookings);
router.get("/bookings/:bookingId", bookingController.getBooking);
router.put("/bookings/:bookingId/status", bookingController.updateBookingStatus);
router.delete("/bookings/:bookingId", bookingController.cancelBooking);
router.post("/bookings/payment/stripe", bookingController.createStripePayment);
router.post("/bookings/payment/confirm", bookingController.confirmPayment);
router.get("/bookings", bookingController.getAllBookings);

// ========== BOOKING ROUTES (Stripe Integration) ==========
// Legacy routes for Stripe payment integration - still supported for backward compatibility
router.post("/bookings/create", protectUser, createBookingStripe);
router.get("/bookings/seats/:showId", fetchOccupiedSeats);
router.get("/my-bookings", protectUser, fetchUserBookings);
router.put("/bookings/:bookingId/cancel", protectUser, cancelBooking);
router.post("/bookings/confirm-stripe", protectUser, confirmStripePayment);

// ========== THEATER ROUTES ==========
router.get("/theaters", fetchAllTheatres);
router.get("/theaters/manager/:managerId", protectUser, getTheatresByManager);
router.get("/theaters/:id", fetchTheatre);
router.put("/theaters/:id", protectUser, updateTheatre);
router.delete("/theaters/:id", protectUser, deleteTheatre);

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
// Specific routes FIRST (before parameterized routes)
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/signup/request-otp", requestSignupOtp);
router.post("/signup/complete", completeSignupWithOtp);
router.get("/is-admin", protectUser, checkIsAdmin);
router.get("/favorites", protectUser, getUserFavorites);
router.post("/update-favorite", protectUser, updateUserFavorites);

// Password management routes
router.post("/forgot-password", otpRateLimiter(), forgotPasswordRequest);
router.post("/forgot-password/resend", otpRateLimiter(), resendForgotOtp);
router.post("/reset-password", resetPasswordWithOtp);
router.post("/change-password", protectUser, changePassword);

router.get("/", getAllUsers);
// Parameterized routes LAST
router.get("/:userId", getUserProfile);
router.put("/:userId", updateUser);
router.delete("/:userId", deleteUser);

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
