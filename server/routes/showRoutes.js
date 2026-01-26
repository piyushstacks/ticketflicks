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
} from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get("/now-playing", protectAdmin, fetchNowPlayingMovies);
showRouter.post("/add", protectAdmin, addShow);
showRouter.get("/all", fetchShows);
showRouter.get("/upcoming-movies", fetchUpcomingMovies);
showRouter.get("/trailer/:movieId", getMovieTrailer);
showRouter.get("/movies-available", getAvailableMoviesForCustomers); // Public: Get available movies for customers
showRouter.get("/by-movie/:movieId", fetchShowsByMovie); // Get shows grouped by theater/screen
// Important: place specific routes before parameter routes to avoid collisions
showRouter.get("/show/:showId", fetchShow); // Get specific show details
showRouter.get("/:movieId", fetchShowByMovieId); // Backward compatibility

export default showRouter;

