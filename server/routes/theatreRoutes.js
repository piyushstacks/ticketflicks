import express from "express";
import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  fetchAllTheatres,
  fetchTheatre,
  updateTheatre,
  getTheatresByManager,
  deleteTheatre,
} from "../controllers/theatreController.js";
import { getTheatreScreensPublic } from "../controllers/publicScreenTblController.js";
import { protectUser } from "../middleware/protectUser.js";

const router = express.Router();

// Public routes
router.get("/", fetchAllTheatres);
router.get("/:id", fetchTheatre);
router.post("/request-otp", requestTheatreRegistrationOtp); // Public endpoint for OTP request
router.post("/register", registerTheatre); // Public endpoint for new theatre registration

// Get screens for a specific theater
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Protected routes (require authentication)
router.get("/manager/:managerId", protectUser, getTheatresByManager);
router.put("/:id", protectUser, updateTheatre);
router.delete("/:id", protectUser, deleteTheatre);

export default router;
