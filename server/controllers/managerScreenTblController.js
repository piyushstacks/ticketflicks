import * as screenService from "../services/screenService.js";
import { asyncHandler } from "../services/errorService.js";

export const getTheatreScreensTbl = asyncHandler(async (req, res) => {
  const screens = await screenService.getTheatreScreens(req.user.id);
  res.json({ success: true, screens });
});

export const addScreenTbl = asyncHandler(async (req, res) => {
  const screen = await screenService.addScreen(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: "Screen added successfully",
    screen,
  });
});

export const editScreenTbl = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const screen = await screenService.updateScreen(
    req.user.id,
    screenId,
    req.body
  );
  res.json({
    success: true,
    message: "Screen updated successfully",
    screen,
  });
});

export const toggleScreenStatusTbl = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const screen = await screenService.toggleScreenStatus(req.user.id, screenId);
  const newStatus = screen.status;
  res.json({
    success: true,
    message: `Screen ${newStatus === "active" ? "enabled" : "disabled"} successfully`,
    screen,
  });
});

export const deleteScreenTbl = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const result = await screenService.deleteScreen(req.user.id, screenId);
  res.json({
    success: true,
    message: result.message,
  });
});

export const getScreenTblById = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const screen = await screenService.getScreenById(req.user.id, screenId);
  res.json({ success: true, screen });
});

// Aliases for compatibility
export const createScreen = addScreenTbl;
export const getAllScreens = getTheatreScreensTbl;
export const getScreensByTheater = getTheatreScreensTbl;
export const getScreen = getScreenTblById;
export const updateScreen = editScreenTbl;
export const deleteScreen = deleteScreenTbl;
export const updateScreenStatus = toggleScreenStatusTbl;

export default {
  getTheatreScreensTbl,
  addScreenTbl,
  editScreenTbl,
  toggleScreenStatusTbl,
  deleteScreenTbl,
  getScreenTblById,
  createScreen,
  getAllScreens,
  getScreensByTheater,
  getScreen,
  updateScreen,
  deleteScreen,
  updateScreenStatus,
};
