import express from "express";
import { protectManager } from "../middleware/auth.js";
import {
  dashboardManagerData,
  getTheatreShows,
  getBookings,
  getTheatreDetails,
} from "../controllers/managerController.js";

const managerRouter = express.Router();

// Dashboard
managerRouter.get("/dashboard", protectManager, dashboardManagerData);

// Theatre Details
managerRouter.get("/theatre/:theatreId", protectManager, getTheatreDetails);

// Shows Management
managerRouter.get("/shows", protectManager, getTheatreShows);

// Bookings
managerRouter.get("/bookings", protectManager, getBookings);

export default managerRouter;
