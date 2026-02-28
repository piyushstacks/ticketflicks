import express from "express";
import { protectManager } from "../middleware/auth.js";
import {
  dashboardManagerData,
  getTheatreShows,
  getBookings,
  getTheatreDetails,
} from "../controllers/managerController.js";
import {
  getAvailableMovies,
  getTheatreScreens,
  addShow,
  getTheatreShows as getManagerShowsList,
  editShow,
  deleteShow,
  toggleShowStatus,
  repeatShowsForNextWeek,
} from "../controllers/managerShowController.js";

const managerRouter = express.Router();

// Dashboard
managerRouter.get("/dashboard", protectManager, dashboardManagerData);

// Theatre Details
managerRouter.get("/theatre/:theatreId", protectManager, getTheatreDetails);

// Books (from managerController) - for booking overview
managerRouter.get("/shows", protectManager, getTheatreShows);
managerRouter.get("/bookings", protectManager, getBookings);

// Show management (from managerShowController)
managerRouter.get("/shows/movies", protectManager, getAvailableMovies);
managerRouter.get("/shows/screens", protectManager, getTheatreScreens);
managerRouter.get("/shows/list", protectManager, getManagerShowsList);
managerRouter.post("/shows/add", protectManager, addShow);
managerRouter.put("/shows/:showId", protectManager, editShow);
managerRouter.delete("/shows/:showId", protectManager, deleteShow);
managerRouter.patch("/shows/:showId/status", protectManager, toggleShowStatus);
managerRouter.post("/shows/repeat-week", protectManager, repeatShowsForNextWeek);

export default managerRouter;
