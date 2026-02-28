import express from "express";
import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  getAllTheatres,
  getTheatreDetails,
  searchTheatres,
} from "../controllers/theatreController.js";
import { getTheatreScreensPublic } from "../controllers/publicScreenTblController.js";

const router = express.Router();

// Public routes
router.get("/", getAllTheatres);
router.get("/search", searchTheatres);
router.post("/request-otp", requestTheatreRegistrationOtp); // Public endpoint for OTP request
router.post("/register", registerTheatre); // Public endpoint for new theatre registration

// Get screens for a specific theatre
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Generic theatre fetch route (keep after more specific routes)
router.get("/:id", getTheatreDetails);

export default router;
