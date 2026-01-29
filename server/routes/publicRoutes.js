import express from "express";
import {
  getShowsByMovie,
  getMovieDetails,
  getShowsByTheatre,
} from "../controllers/publicController.js";

const publicRouter = express.Router();

// Public endpoints - no authentication required
publicRouter.get("/shows/by-movie/:movieId", getShowsByMovie);
publicRouter.get("/shows/by-theatre/:theatreId", getShowsByTheatre);
publicRouter.get("/movies/:movieId", getMovieDetails);

export default publicRouter;
