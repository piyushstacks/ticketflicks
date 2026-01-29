import express from "express";
import {
  createBooking,
  confirmStripePayment,
  fetchOccupiedSeats,
  fetchUserBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protectUser } from "../middleware/protectUser.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", protectUser, createBooking);
bookingRouter.post("/confirm-stripe", protectUser, confirmStripePayment);
bookingRouter.get("/seats/:showId", fetchOccupiedSeats);
bookingRouter.get("/my-bookings", protectUser, fetchUserBookings);
bookingRouter.put("/:bookingId/cancel", protectUser, cancelBooking);

export default bookingRouter;

