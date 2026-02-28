import * as managerShowService from "../services/managerShowService.js";
import { asyncHandler } from "../services/errorService.js";

export const getAvailableMovies = asyncHandler(async (req, res) => {
  const movies = await managerShowService.getAvailableMovies(req.user.id);
  res.json({ success: true, movies });
});

export const getTheatreScreens = asyncHandler(async (req, res) => {
  const screens = await managerShowService.getTheatreScreens(req.user.id);
  res.json({ success: true, screens });
});

export const addShow = asyncHandler(async (req, res) => {
  const show = await managerShowService.addShow(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: "Show added successfully",
    show,
  });
});

export const getTheatreShows = asyncHandler(async (req, res) => {
  const { movieId, status = "all" } = req.query;
  const shows = await managerShowService.getTheatreShows(
    req.user.id,
    movieId || null,
    status
  );
  res.json({ success: true, shows });
});

export const editShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const show = await managerShowService.updateShow(
    req.user.id,
    showId,
    req.body
  );
  res.json({
    success: true,
    message: "Show updated successfully",
    show,
  });
});

export const deleteShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const result = await managerShowService.deleteShow(req.user.id, showId);
  res.json({
    success: true,
    message: result.message,
  });
});

export const dashboardManagerData = asyncHandler(async (req, res) => {
  const data = await managerShowService.getDashboardData(req.user.id);
  res.json({ success: true, data });
});

export const toggleShowStatus = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const { isActive } = req.body;
  const show = await managerShowService.toggleShowStatus(
    req.user.id,
    showId,
    isActive
  );
  res.json({
    success: true,
    message: `Show ${isActive ? "enabled" : "disabled"} successfully`,
    show,
  });
});

export const repeatShowsForNextWeek = asyncHandler(async (req, res) => {
  const { currentWeekStart, currentWeekEnd, nextWeekStart, nextWeekEnd } =
    req.body;
  const result = await managerShowService.repeatShowsForNextWeek(
    req.user.id,
    currentWeekStart,
    currentWeekEnd,
    nextWeekStart,
    nextWeekEnd
  );
  res.json({
    success: true,
    message: result.message,
    count: result.count,
  });
});

export default {
  getAvailableMovies,
  getTheatreScreens,
  addShow,
  getTheatreShows,
  editShow,
  deleteShow,
  dashboardManagerData,
  toggleShowStatus,
  repeatShowsForNextWeek,
};
