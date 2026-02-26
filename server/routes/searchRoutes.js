import express from "express";
import {
  searchMovies,
  searchTheatres,
  searchMoviesAndShows,
} from "../controllers/searchController_new.js";

const router = express.Router();

// Search routes - mounted at /api/search
router.get("/movies", searchMovies);
router.get("/theatres", searchTheatres);
router.get("/all", searchMoviesAndShows);

export default router;
