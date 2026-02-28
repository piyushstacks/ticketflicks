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
import { getTheatreScreensTbl, addScreenTbl, editScreenTbl, toggleScreenStatusTbl, deleteScreenTbl, getScreenTblById } from "../controllers/managerScreenTblController.js";
import { protectManager } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllTheatres);
router.get("/search", searchTheatres);
router.post("/request-otp", requestTheatreRegistrationOtp);
router.post("/verify-otp", verifyTheatreOtp);
router.post("/register", registerTheatre);

// Manager screens CRUD (authenticated)
router.get("/screens", protectManager, getTheatreScreensTbl);
router.post("/screens", protectManager, addScreenTbl);
router.get("/screens/:screenId", protectManager, getScreenTblById);
router.put("/screens/:screenId", protectManager, editScreenTbl);
router.delete("/screens/:screenId", protectManager, deleteScreenTbl);
router.patch("/screens/:screenId/status", protectManager, toggleScreenStatusTbl);

// Get screens for a specific theatre (public)
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Generic theatre fetch route (keep after more specific routes)
router.get("/:id", getTheatreDetails);

export default router;
