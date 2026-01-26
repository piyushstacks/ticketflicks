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
export const createScreen = theatreController.addScreen;
export const fetchScreensByTheater = async (req, res) => {
  // The theatre controller stores screens embedded; return that list for compatibility
  if (req.params.theaterId && !req.params.id) req.params.id = req.params.theaterId;
  const { id } = req.params;
  const { default: Theatre } = await import("../models/Theatre.js");
  const theatre = await Theatre.findById(id);
  if (!theatre) return res.json({ success: false, message: "Theatre not found" });
  return res.json({ success: true, screens: theatre.screens || [] });
};
export const fetchScreen = theatreController.fetchTheatre; // Not a direct mapping; kept for compatibility
export const updateScreen = theatreController.updateScreen;
export const deleteScreen = theatreController.deleteScreen;
