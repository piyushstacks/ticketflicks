import express from "express";
import {
  getShowsByMovie,
  getMovieDetails,
  getShowsByTheatre,
} from "../controllers/publicController.js";
import {
  getTheatreScreensPublic,
  getScreenDetailsPublic,
  getScreensByManagerPublic,
} from "../controllers/publicScreenTblController.js";

const publicRouter = express.Router();

// Public endpoints - no authentication required
publicRouter.get("/shows/by-movie/:movieId", getShowsByMovie);
publicRouter.get("/shows/by-theatre/:theatreId", getShowsByTheatre);
publicRouter.get("/movies/:movieId", getMovieDetails);

// SCREEN_TBL public endpoints
publicRouter.get("/screens/theatre/:theatreId", getTheatreScreensPublic);
publicRouter.get("/screens/:screenId", getScreenDetailsPublic);
publicRouter.get("/screens/manager/:managerId", getScreensByManagerPublic);

export default publicRouter;
