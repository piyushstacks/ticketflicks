import express from "express";
import {
  requestTheatreRegistrationOtp,
  verifyTheatreOtp,
  registerTheatre,
  getAllTheatres,
  getTheatreDetails,
  searchTheatres,
} from "../controllers/theatreController.js";
import { getTheatreScreensPublic } from "../controllers/publicScreenTblController.js";
import { getTheatreScreens } from "../controllers/managerShowController.js";
import { protectManager } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllTheatres);
router.get("/search", searchTheatres);
router.post("/request-otp", requestTheatreRegistrationOtp); // Public endpoint for OTP request
router.post("/verify-otp", verifyTheatreOtp); // Public endpoint to verify OTP
router.post("/register", registerTheatre); // Public endpoint for new theatre registration

// Manager: get screens for their own theatre (auth required)
router.get("/screens", protectManager, getTheatreScreens);

// Get screens for a specific theatre
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Generic theatre fetch route (keep after more specific routes)
router.get("/:id", getTheatreDetails);

export default router;

