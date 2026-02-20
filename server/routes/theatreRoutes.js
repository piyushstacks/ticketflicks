import express from "express";
import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  fetchAllTheatres,
  fetchTheatre,
  updateTheatre,
  getTheatresByManager,
  deleteTheatre,
  searchTheatres,
} from "../controllers/theatreController.js";
import { getTheatreScreensPublic } from "../controllers/publicScreenTblController.js";
import { protectUser } from "../middleware/protectUser.js";

const router = express.Router();

// Public routes
router.get("/", fetchAllTheatres);
router.get("/:id", fetchTheatre);
router.get("/find/search", searchTheatres);
router.post("/request-otp", requestTheatreRegistrationOtp); // Public endpoint for OTP request
router.post("/register", registerTheatre); // Public endpoint for new theatre registration

// Get screens for a specific theatre
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Protected routes (require authentication)
router.get("/manager/:managerId", protectUser, getTheatresByManager);
router.put("/:id", protectUser, updateTheatre);
router.delete("/:id", protectUser, deleteTheatre);

export default router;
