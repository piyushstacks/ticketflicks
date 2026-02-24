import express from "express";

// New Controllers
import showController from "../controllers/showController_new.js";
import bookingController from "../controllers/bookingController_new.js";
import theaterController from "../controllers/theaterController_new.js";
import screenController from "../controllers/screenController_new.js";
import movieController from "../controllers/movieController_new.js";
import userController from "../controllers/userController_new.js";
import seatController from "../controllers/seatController_new.js";
import metadataController from "../controllers/metadataController_new.js";
import reviewPaymentController from "../controllers/reviewPaymentController_new.js";

const router = express.Router();

// ========== SHOW ROUTES ==========
router.post("/shows", showController.addShow);
router.get("/shows", showController.fetchShows);
router.get("/shows/all", showController.fetchShows); // Frontend expects /all endpoint
router.get("/shows/:showId", showController.fetchShow);
router.get("/shows/movie/:movieId", showController.fetchShowsByMovie);
router.put("/shows/:showId", showController.updateShow);
router.delete("/shows/:showId", showController.deleteShow);
router.patch("/shows/:showId/status", showController.toggleShowStatus);
router.get("/movies/available", showController.getAvailableMovies);
router.get("/upcoming-movies", movieController.getAllMovies); // Frontend expects this
router.get("/trailer/:id", movieController.getMovie); // Frontend expects this

// ========== BOOKING ROUTES ==========
router.post("/bookings", bookingController.createBooking);
router.get("/bookings/user/:user_id", bookingController.getUserBookings);
router.get("/bookings/:bookingId", bookingController.getBooking);
router.put("/bookings/:bookingId/status", bookingController.updateBookingStatus);
router.delete("/bookings/:bookingId", bookingController.cancelBooking);
router.post("/bookings/payment/stripe", bookingController.createStripePayment);
router.post("/bookings/payment/confirm", bookingController.confirmPayment);
router.get("/bookings", bookingController.getAllBookings);

// ========== THEATER ROUTES ==========
router.post("/theaters", theaterController.createTheater);
router.get("/theaters", theaterController.getAllTheaters);
router.get("/theaters/:theaterId", theaterController.getTheater);
router.put("/theaters/:theaterId", theaterController.updateTheater);
router.delete("/theaters/:theaterId", theaterController.deleteTheater);
router.get("/theaters/manager/:userId", theaterController.getTheatersByManager);

// ========== SCREEN ROUTES ==========
router.post("/screens", screenController.createScreen);
router.get("/screens", screenController.getAllScreens);
router.get("/screens/theater/:theaterId", screenController.getScreensByTheater);
router.get("/screens/:screenId", screenController.getScreen);
router.put("/screens/:screenId", screenController.updateScreen);
router.delete("/screens/:screenId", screenController.deleteScreen);

// ========== MOVIE ROUTES ==========
router.post("/movies", movieController.createMovie);
router.get("/movies", movieController.getAllMovies);
router.get("/movies/:movieId", movieController.getMovie);
router.put("/movies/:movieId", movieController.updateMovie);
router.delete("/movies/:movieId", movieController.deleteMovie);
router.get("/movies/search", movieController.searchMovies);
router.get("/movies/tmdb/now-playing", movieController.fetchNowPlayingFromTMDB);
router.post("/movies/tmdb/import/:tmdbId", movieController.importMovieFromTMDB);

// ========== USER ROUTES ==========
router.post("/users/register", userController.registerUser);
router.post("/users/login", userController.loginUser);
router.get("/users/:userId", userController.getUserProfile);
router.put("/users/:userId", userController.updateUser);
router.get("/users", userController.getAllUsers);
router.delete("/users/:userId", userController.deleteUser);

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
router.post("/reviews", reviewPaymentController.createReview);
router.get("/reviews/movie/:movieId", reviewPaymentController.getReviewsByMovie);
router.get("/reviews/user/:userId", reviewPaymentController.getReviewsByUser);
router.put("/reviews/:reviewId", reviewPaymentController.updateReview);
router.delete("/reviews/:reviewId", reviewPaymentController.deleteReview);

// ========== PAYMENT ROUTES ==========
router.post("/payments", reviewPaymentController.createPayment);
router.get("/payments", reviewPaymentController.getAllPayments);
router.get("/payments/booking/:bookingId", reviewPaymentController.getPaymentByBooking);
router.get("/payments/transaction/:transactionId", reviewPaymentController.getPaymentByTransactionId);
router.put("/payments/:paymentId/status", reviewPaymentController.updatePaymentStatus);

export default router;
