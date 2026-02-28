import ShowTbls from "../models/show_tbls.js";
import ScreenTbl from "../models/ScreenTbl.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import { AppError } from "./errorService.js";

export const getManagerTheatre = async (managerId) => {
  const manager = await User.findById(managerId);

  if (!manager || manager.role !== "manager") {
    throw new AppError("Unauthorized - Manager access required", 403);
  }

  if (!manager.managedTheatreId) {
    throw new AppError("Manager has no theatre assigned", 400);
  }

  return manager.managedTheatreId;
};

// Get all active movies available for managers to schedule shows
export const getAvailableMovies = async (managerId) => {
  // Verify manager exists
  await getManagerTheatre(managerId);

  // Return all active movies from DB
  const movies = await Movie.find({ isActive: true })
    .select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language isActive _id trailer_link trailer_path")
    .sort({ createdAt: -1 });

  return movies.map((movie) => ({
    ...movie.toObject(),
    // Normalize field names for frontend
    overview: movie.overview || movie.description || "",
    runtime: movie.runtime || movie.duration_min || 120,
  }));
};

export const getTheatreScreens = async (managerId) => {
  const theatreId = await getManagerTheatre(managerId);

  const screens = await ScreenTbl.find({
    theatre: theatreId,
  }).populate("theatre", "name");

  return screens;
};

function getCurrentWeekDates() {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(today);
  monday.setDate(diff);
  const sunday = new Date(today);
  sunday.setDate(diff + 6);

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export const addShow = async (managerId, showData) => {
  console.log("[managerShowService.addShow] Raw showData received:", JSON.stringify(showData));

  // Normalize field names: support both {movie,screen} and {movieId,screenId}
  const movie = showData.movie || showData.movieId;
  const screen = showData.screen || showData.screenId;
  const language = showData.language || "English";
  const startDate = showData.startDate;
  const endDate = showData.endDate;
  const isActive = showData.isActive !== undefined ? showData.isActive : true;
  const showDateTime = showData.showDateTime;
  const customSeatTiers = showData.seatTiers;

  // Extract showTime from showDateTime if not provided directly
  // Formats: "14:30", "14:30:00", or from "2026-03-10T14:30:00"
  let showTime = showData.showTime;
  if (!showTime && showDateTime) {
    const parts = showDateTime.split('T');
    if (parts.length > 1) {
      showTime = parts[1].substring(0, 5); // "HH:MM"
    }
  }

  const theatreId = await getManagerTheatre(managerId);

  console.log("[managerShowService.addShow] Normalized:", { movie, screen, showTime, startDate, endDate, showDateTime });

  if (!movie || !screen || !showTime) {
    throw new AppError(
      `Movie, Screen, and Show Time are required. Got: movie=${movie}, screen=${screen}, showTime=${showTime}`,
      400
    );
  }

  const movieDoc = await Movie.findOne({ _id: movie, isActive: true });
  if (!movieDoc) {
    throw new AppError("Movie not found or is inactive", 404);
  }

  const screenDoc = await ScreenTbl.findOne({ _id: screen, theatre: theatreId });
  if (!screenDoc) {
    throw new AppError("Screen not found for this theatre", 404);
  }

  const currentWeek = getCurrentWeekDates();
  const showStartDate = startDate || currentWeek.start;
  const showEndDate = endDate || currentWeek.end;

  // Allow today's shows — only reject if end date is clearly in the past (>1 day ago)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  if (new Date(showEndDate) < yesterday) {
    throw new AppError("Show end date cannot be more than 1 day in the past.", 400);
  }

  // Build showDateTime from startDate + showTime if not provided
  const showDateTimeStr = showDateTime || `${showStartDate}T${showTime}:00`;
  const showDateTimeObj = new Date(showDateTimeStr);

  if (isNaN(showDateTimeObj.getTime())) {
    throw new AppError("Invalid show date/time", 400);
  }

  // Check for duplicate
  const existingShow = await ShowTbls.findOne({
    movie,
    screen,
    showDateTime: showDateTimeObj,
    theatre: theatreId,
  });

  if (existingShow) {
    throw new AppError("Show already exists for this time slot and date range", 409);
  }

  // Build seatTiers - use custom if provided, else use screen defaults
  let finalSeatTiers;
  if (customSeatTiers && customSeatTiers.length > 0) {
    finalSeatTiers = customSeatTiers.map((tier) => ({
      tierName: tier.tierName,
      price: tier.price,
      totalSeats: tier.totalSeats || 0,
      occupiedSeats: {},
    }));
  } else {
    finalSeatTiers = screenDoc.seatTiers.map((tier) => ({
      tierName: tier.tierName,
      price: tier.price,
      seatsPerRow: tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow,
      rowCount: tier.rows ? tier.rows.length : 0,
      totalSeats: (tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow) * (tier.rows ? tier.rows.length : 0),
      occupiedSeats: {},
    }));
  }

  const show = await ShowTbls.create({
    movie,
    theatre: theatreId,
    screen,
    showDateTime: showDateTimeObj,
    showTime: showTime,                   // "HH:MM" string
    startDate: showStartDate,             // "YYYY-MM-DD" string
    endDate: showEndDate,                 // "YYYY-MM-DD" string
    language,
    basePrice: 150,
    seatTiers: finalSeatTiers,
    totalCapacity: screenDoc.seatLayout.totalSeats,
    isActive,
  });

  await show.populate("movie screen");
  return show;
};

export const getTheatreShows = async (managerId, movieId = null, status = "all") => {
  const theatreId = await getManagerTheatre(managerId);

  let query = { theatre: theatreId };

  if (movieId) query.movie = movieId;

  if (status === "upcoming") {
    query.showDateTime = { $gte: new Date() };
  } else if (status === "past") {
    query.showDateTime = { $lt: new Date() };
  }

  const shows = await ShowTbls.find(query)
    .populate("movie", "_id title poster_path overview description")
    .populate("screen", "_id screenNumber name")
    .sort({ showDateTime: -1 });

  const validShows = shows.filter((show) => {
    const hasMovie = show.movie && show.movie._id;
    const hasScreen = show.screen && show.screen._id;
    return hasMovie && hasScreen;
  });

  return validShows;
};

export const updateShow = async (managerId, showId, updateData) => {
  const theatreId = await getManagerTheatre(managerId);

  const show = await ShowTbls.findOne({ _id: showId, theatre: theatreId });
  if (!show) throw new AppError("Show not found for this theatre", 404);

  const updatedShow = await ShowTbls.findByIdAndUpdate(showId, updateData, {
    new: true,
    runValidators: false,
  }).populate("movie screen");

  return updatedShow;
};

export const deleteShow = async (managerId, showId) => {
  const theatreId = await getManagerTheatre(managerId);

  const show = await ShowTbls.findOne({ _id: showId, theatre: theatreId });
  if (!show) throw new AppError("Show not found for this theatre", 404);

  await ShowTbls.findByIdAndDelete(showId);
  return { message: "Show deleted successfully" };
};

export const toggleShowStatus = async (managerId, showId, isActive) => {
  const theatreId = await getManagerTheatre(managerId);

  const show = await ShowTbls.findById(showId);
  if (!show) throw new AppError("Show not found", 404);
  if (show.theatre.toString() !== theatreId.toString()) {
    throw new AppError("Not authorized to manage this show", 403);
  }

  show.isActive = isActive;
  await show.save();
  return show;
};

export const getDashboardData = async (managerId) => {
  const theatreId = await getManagerTheatre(managerId);

  const activeShows = await ShowTbls.countDocuments({
    theatre: theatreId,
    showDateTime: { $gte: new Date() },
    isActive: true,
  });

  const totalShows = await ShowTbls.countDocuments({ theatre: theatreId });
  const theatre = await Theatre.findById(theatreId);

  return {
    activeShows,
    totalShows,
    theatreName: theatre?.name || "N/A",
    theatreCity: theatre?.city || "N/A",
    theatreId,
  };
};

export const repeatShowsForNextWeek = async (managerId, currentWeekStart, currentWeekEnd, nextWeekStart, nextWeekEnd) => {
  const theatreId = await getManagerTheatre(managerId);

  const currentShows = await ShowTbls.find({
    theatre: theatreId,
    startDate: { $gte: new Date(currentWeekStart) },
    endDate: { $lte: new Date(currentWeekEnd) },
    isActive: true,
  }).populate("movie screen");

  let repeatedShows = 0;

  for (const show of currentShows) {
    const existingShow = await ShowTbls.findOne({
      theatre: theatreId,
      movie: show.movie._id,
      screen: show.screen._id,
      showTime: show.showTime,
      language: show.language,
      startDate: { $gte: new Date(nextWeekStart) },
      endDate: { $lte: new Date(nextWeekEnd) },
    });

    if (!existingShow) {
      const nextShowDateTime = new Date(`${nextWeekStart}T${show.showTime || "10:00"}:00`);
      await ShowTbls.create({
        theatre: theatreId,
        movie: show.movie._id,
        screen: show.screen._id,
        showDateTime: nextShowDateTime,
        showTime: show.showTime,
        startDate: new Date(nextWeekStart),
        endDate: new Date(nextWeekEnd),
        language: show.language,
        basePrice: show.basePrice || 150,
        seatTiers: show.seatTiers || [],
        totalCapacity: show.totalCapacity || 200,
        isActive: true,
      });
      repeatedShows++;
    }
  }

  return { message: `Successfully repeated ${repeatedShows} shows for next week`, count: repeatedShows };
};
