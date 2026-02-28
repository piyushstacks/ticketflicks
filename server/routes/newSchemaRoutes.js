import express from "express";
import { protectUser } from "../middleware/protectUser.js";

// Controllers
import showController from "../controllers/showController.js";
import bookingController from "../controllers/bookingController.js";
import screenController from "../controllers/managerScreenTblController.js";
import movieController from "../controllers/adminMovieController.js";
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
} from "../controllers/bookingController.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// ========== THEATER REGISTRATION (Public) ==========
router.post("/request-otp", requestTheatreRegistrationOtp);
router.post("/register", registerTheatre);

// ========== SHOW ROUTES ==========
router.post("/shows", protectUser, showController.addShow);
router.get("/shows", showController.fetchShows);
router.get("/shows/all", showController.fetchShows); // Frontend expects /all endpoint
router.get("/shows/:showId", showController.fetchShow);
router.get("/show/:showId", showController.fetchShow); // Alias for /shows/:showId
router.get("/shows/movie/:movieId", showController.fetchShowsByMovie);
router.put("/shows/:showId", protectUser, showController.updateShow);
router.delete("/shows/:showId", protectUser, showController.deleteShow);
router.patch("/shows/:showId/status", protectUser, showController.toggleShowStatus);
// Repeat shows for next week - accessible by both managers and admins
router.post("/shows/repeat-week", protectUser, async (req, res) => {
  try {
    const managerShowService = await import("../services/managerShowService.js");
    const { currentWeekStart, currentWeekEnd, nextWeekStart, nextWeekEnd } = req.body;
    const result = await managerShowService.repeatShowsForNextWeek(
      req.user.id,
      currentWeekStart, currentWeekEnd, nextWeekStart, nextWeekEnd
    );
    res.json({ success: true, message: result.message, count: result.count });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
router.get("/movies/available", showController.getAvailableMoviesForCustomers); // Public - for home page
router.get("/movies/all-active", showController.getAllActiveMovies); // Public - all active movies  
router.get("/movies/all", showController.getAllMoviesForManager); // All active movies (for manager scheduling)
router.get("/upcoming-movies", showController.fetchUpcomingMovies); // Frontend expects this
router.get("/trailer/:movieId", showController.getMovieTrailer); // Trailer by movie ID
router.get("/trailer/:id", showController.getMovieTrailer); // Alias
router.get("/movies/:movieId/details", showController.fetchShowByMovieId); // Movie + showtimes

// ========== BOOKING ROUTES ==========
// Standard booking routes
router.post("/bookings", protectUser, createBooking);
router.get("/bookings/:id", getBookingDetails);
router.post("/bookings/confirm", protectUser, confirmStripePayment);
router.put("/bookings/:id/cancel", protectUser, cancelBooking);
router.get("/bookings/availability/:showId", checkSeatsAvailability);
router.post("/bookings/pricing", calculatePricing);

// Aliases for /api/booking/ prefix (ManagerBookings, MyBookings use these)
router.post("/create", protectUser, createBooking);
router.post("/confirm-stripe", protectUser, confirmStripePayment);
router.get("/my-bookings", protectUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.user.id })
      .populate({
        path: "show_id",
        populate: [
          { path: "movie", select: "title poster_path overview" },
          { path: "theatre", select: "name city location" },
          { path: "screen", select: "name screenNumber" },
        ],
      })
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b) => ({
      _id: b._id,
      show: b.show_id,
      theatre: b.show_id?.theatre,
      screen: b.show_id?.screen,
      bookedSeats: b.seats_booked || [],
      amount: b.total_amount || 0,
      isPaid: b.payment_status === "completed",
      paymentMode: b.payment_method || "stripe",
      paymentLink: b.payment_link,
      status: b.status,
      createdAt: b.createdAt,
    }));

    res.json({ success: true, bookings: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get("/bookings", protectUser, async (req, res) => {
  // For managers: fetch bookings for their theatre's shows
  try {
    const user = req.user;
    let query = {};
    if (user.role === "manager" && user.managedTheatreId) {
      // Find shows for this theatre
      const { default: Show } = await import("../models/show_tbls.js");
      const showIds = await Show.find({ theatre: user.managedTheatreId }).distinct("_id");
      query = { show_id: { $in: showIds } };
    } else if (user.role === "customer") {
      query = { user_id: user.id };
    }

    const bookings = await Booking.find(query)
      .populate("user_id", "name email")
      .populate({
        path: "show_id",
        populate: { path: "movie", select: "title poster_path" },
      })
      .sort({ createdAt: -1 })
      .limit(100);

    const formatted = bookings.map((b) => ({
      _id: b._id,
      user: b.user_id || { name: "Unknown" },
      show: b.show_id,
      bookedSeats: b.seats_booked || [],
      selectedSeats: b.seats_booked || [],
      amount: b.total_amount || 0,
      isPaid: b.payment_status === "completed",
      status: b.status,
      createdAt: b.createdAt,
    }));

    res.json({ success: true, bookings: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
router.post("/signup/request-otp", otpRateLimiter(), authController.requestSignupOtp);
router.post("/signup/complete", authController.completeSignupWithOtp);

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
