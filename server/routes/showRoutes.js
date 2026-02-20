import express from "express";
import {
  addShow,
  fetchNowPlayingMovies,
  fetchShow,
  fetchShows,
  fetchShowByMovieId,
  fetchShowsByMovie,
  fetchUpcomingMovies,
  getMovieTrailer,
  getAvailableMoviesForCustomers,
  getAllActiveMovies,
  getAllShowsDebug,
  searchMoviesAndShows,
} from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get("/now-playing", protectAdmin, fetchNowPlayingMovies);
showRouter.post("/add", protectAdmin, addShow);
showRouter.get("/all", fetchShows);
showRouter.get("/debug-all-shows", getAllShowsDebug); // Debug: Get all shows regardless of date
showRouter.get("/upcoming-movies", fetchUpcomingMovies);
showRouter.get("/trailer/:movieId", getMovieTrailer);
showRouter.get("/movies-available", getAvailableMoviesForCustomers); // Public: Get available movies for customers
showRouter.get("/movies", getAllActiveMovies); // Public: Get all active movies (fallback when no shows exist)
showRouter.get("/all-movies", getAllActiveMovies); // Public: Get all movies (alias for /movies)
showRouter.get("/search", searchMoviesAndShows); // Public: Search movies and shows
showRouter.get("/by-movie/:movieId", fetchShowsByMovie); // Get shows grouped by theatre/screen
// Important: place specific routes before parameter routes to avoid collisions
showRouter.get("/show/:showId", fetchShow); // Get specific show details
showRouter.get("/:movieId", fetchShowByMovieId); // Backward compatibility

export default showRouter;

