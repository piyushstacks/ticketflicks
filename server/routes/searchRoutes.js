import express from "express";
import {
  searchMoviesAndShows,
} from "../controllers/showController.js";
import {
  searchTheatres,
} from "../controllers/theatreController.js";

const router = express.Router();

// Search routes - mounted at /api/search
router.get("/movies", searchMoviesAndShows);
router.get("/theatres", searchTheatres);
router.get("/all", searchMoviesAndShows);

export default router;
