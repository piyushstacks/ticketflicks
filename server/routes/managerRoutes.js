import express from "express";
import { protectManager } from "../middleware/auth.js";
import {
  getAvailableMovies,
  getTheatreScreens,
  addShow,
  getTheatreShows,
  editShow,
  deleteShow,
  dashboardManagerData,
} from "../controllers/managerShowController.js";
import {
  addScreen,
  editScreen,
  deleteScreen,
  getManagerBookings,
} from "../controllers/managerController.js";

const managerRouter = express.Router();

// Dashboard
managerRouter.get("/dashboard", protectManager, dashboardManagerData);

// Movie Management (Select from admin-added movies)
managerRouter.get("/movies/available", protectManager, getAvailableMovies);

// Screen Management
managerRouter.get("/screens", protectManager, getTheatreScreens);
managerRouter.post("/screens/add", protectManager, addScreen);
managerRouter.put("/screens/:screenId", protectManager, editScreen);
managerRouter.delete("/screens/:screenId", protectManager, deleteScreen);

// Shows Management (New Workflow)
managerRouter.get("/shows", protectManager, getTheatreShows);
managerRouter.post("/shows/add", protectManager, addShow);
managerRouter.put("/shows/:showId", protectManager, editShow);
managerRouter.delete("/shows/:showId", protectManager, deleteShow);

// Bookings
managerRouter.get("/bookings", protectManager, getManagerBookings);

export default managerRouter;
