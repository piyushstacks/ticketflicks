import express from "express";
import {
  requestTheatreRegistrationOtp,
  registerTheatre,
  fetchAllTheatres,
  fetchTheatre,
  updateTheatre,
  addScreen,
  updateScreen,
  deleteScreen,
  getTheatresByManager,
  deleteTheatre,
} from "../controllers/theatreController.js";
import { protectUser } from "../middleware/protectUser.js";

const router = express.Router();

// Public routes
router.get("/", fetchAllTheatres);
router.get("/:id", fetchTheatre);
router.post("/request-otp", requestTheatreRegistrationOtp); // Public endpoint for OTP request
router.post("/register", registerTheatre); // Public endpoint for new theatre registration

// Debug endpoint (temporary - remove in production)
router.get("/debug/manager/:managerId", async (req, res) => {
  try {
    const { managerId } = req.params;
    console.log("DEBUG: Fetching theatres for manager ID:", managerId);
    
    const Theatre = (await import("../models/Theatre.js")).default;
    const User = (await import("../models/User.js")).default;
    
    // Check manager
    const manager = await User.findById(managerId);
    console.log("DEBUG: Manager found:", manager ? manager.name : "No manager found");
    
    // Check theatres
    const theatres = await Theatre.find({ manager_id: managerId });
    console.log("DEBUG: Theatres found:", theatres.length);
    
    res.json({
      success: true,
      manager: manager ? {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role
      } : null,
      theatres: theatres.map(t => ({
        id: t._id,
        name: t.name,
        manager_id: t.manager_id
      })),
      theatresCount: theatres.length
    });
  } catch (error) {
    console.error("DEBUG: Error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Protected routes (require authentication)
router.get("/manager/:managerId", protectUser, getTheatresByManager);
router.put("/:id", protectUser, updateTheatre);
router.delete("/:id", protectUser, deleteTheatre);

// Screen management routes
router.post("/:id/screen", protectUser, addScreen);
router.put("/:id/screen/:screenIndex", protectUser, updateScreen);
router.delete("/:id/screen/:screenIndex", protectUser, deleteScreen);

export default router;
