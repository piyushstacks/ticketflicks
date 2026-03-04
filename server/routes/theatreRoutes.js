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
import {
  getTheatreScreensTbl,
  addScreenTbl,
  editScreenTbl,
  toggleScreenStatusTbl,
  deleteScreenTbl,
  getScreenTblById,
} from "../controllers/managerScreenTblController.js";
import { protectManager } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getAllTheatres);
router.get("/search", searchTheatres);
router.post("/request-otp", requestTheatreRegistrationOtp);
router.post("/verify-otp", verifyTheatreOtp);
router.post("/register", registerTheatre);

// ── Manager: Screen CRUD (all auth required) ──────────────────────────────
router.get("/screens", protectManager, getTheatreScreensTbl);           // GET all screens for manager's theatre
router.post("/screens", protectManager, addScreenTbl);                   // POST create new screen
router.get("/screens/:screenId", protectManager, getScreenTblById);     // GET single screen
router.put("/screens/:screenId", protectManager, editScreenTbl);        // PUT update screen
router.patch("/screens/:screenId/status", protectManager, toggleScreenStatusTbl); // PATCH toggle status
router.delete("/screens/:screenId", protectManager, deleteScreenTbl);   // DELETE screen

// Get screens for a specific theatre (public)
router.get("/:theatreId/screens", getTheatreScreensPublic);

// Generic theatre fetch route (keep after more specific routes)
router.get("/:id", getTheatreDetails);

export default router;
