import express from "express";
import { protectManager } from "../middleware/auth.js";
import {
  dashboardManagerData,
  getTheatreShows,
  getBookings,
  getTheatreDetails,
} from "../controllers/managerController.js";
import {
  addShow,
  editShow,
  deleteShow,
  toggleShowStatus,
  getTheatreShows as getManagerTheatreShows,
  getAvailableMovies,
  getTheatreScreens,
  repeatShowsForNextWeek,
  dashboardManagerData as managerShowDashboard,
} from "../controllers/managerShowController.js";

const managerRouter = express.Router();

// Dashboard
managerRouter.get("/dashboard", protectManager, dashboardManagerData);

// Theatre Details
managerRouter.get("/theatre/:theatreId", protectManager, getTheatreDetails);

// Shows Management — /api/manager/shows/*
managerRouter.get("/shows", protectManager, getTheatreShows);       // legacy
managerRouter.get("/shows/list", protectManager, getManagerTheatreShows); // ManagerShows page uses this
managerRouter.post("/shows/add", protectManager, addShow);           // ManagerShows page uses this
managerRouter.put("/shows/:showId", protectManager, editShow);
managerRouter.delete("/shows/:showId", protectManager, deleteShow);
managerRouter.patch("/shows/:showId/status", protectManager, toggleShowStatus);
managerRouter.post("/shows/repeat-week", protectManager, repeatShowsForNextWeek);

// Bookings
managerRouter.get("/bookings", protectManager, getBookings);

export default managerRouter;
