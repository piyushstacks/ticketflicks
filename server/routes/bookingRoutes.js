import express from "express";
import {
  createBooking,
  fetchOccupiedSeats,
  verifyBookingPayment,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.get("/verify", verifyBookingPayment);
bookingRouter.get("/seats/:showId", fetchOccupiedSeats);

export default bookingRouter;
