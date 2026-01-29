// This file is kept as a compatibility layer for legacy imports that used the
// American spelling "theater". All functionality is forwarded to the
// `theatreController` implementation so the codebase can standardize on
// British spelling without breaking older imports.
import * as theatreController from "./theatreController.js";

export const createTheater = theatreController.createTheatre;
export const fetchAllTheaters = theatreController.fetchAllTheatres;
export const fetchTheater = async (req, res) => {
  // Map param name for compatibility (theaterId -> id)
  if (req.params.theaterId && !req.params.id) req.params.id = req.params.theaterId;
  return theatreController.fetchTheatre(req, res);
};
export const updateTheater = async (req, res) => {
  if (req.params.theaterId && !req.params.id) req.params.id = req.params.theaterId;
  return theatreController.updateTheatre(req, res);
};
export const deleteTheater = async (req, res) => {
  if (req.params.theaterId && !req.params.id) req.params.id = req.params.theaterId;
  return theatreController.deleteTheatre(req, res);
};

// Screen-related forwards
export const fetchScreensByTheater = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Use ScreenTbl to get screens data - only for approved, non-disabled theatres
    const { default: Theatre } = await import("../models/Theatre.js");
    const { default: ScreenTbl } = await import("../models/ScreenTbl.js");
    
    const theatre = await Theatre.findById(id);
    
    if (!theatre || theatre.approval_status !== "approved" || theatre.disabled) {
      return res.json({ success: false, message: "Theatre not found" });
    }
    
    // Fetch screens from ScreenTbl
    const screens = await ScreenTbl.find({ theatre: id });
    
    res.json({ success: true, screens });
  } catch (error) {
    console.error("[fetchScreensByTheater]", error);
    res.json({ success: false, message: error.message });
  }
};
export const fetchScreen = theatreController.fetchTheatre; // Not a direct mapping; kept for compatibility
