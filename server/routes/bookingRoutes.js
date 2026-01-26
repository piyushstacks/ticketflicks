import express from "express";
import {
  createBooking,
  fetchOccupiedSeats,
  fetchUserBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protectUser } from "../middleware/protectUser.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", protectUser, createBooking);
bookingRouter.get("/seats/:showId", fetchOccupiedSeats);
bookingRouter.get("/my-bookings", protectUser, fetchUserBookings);
bookingRouter.put("/:bookingId/cancel", protectUser, cancelBooking);

export default bookingRouter;

