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

export const getAvailableMovies = async (managerId) => {
  const theatreId = await getManagerTheatre(managerId);

  const movies = await Movie.find({
    isActive: true,
  })
    .select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language isActive theatres excludedTheatres _id"
    )
    .sort({ createdAt: -1 });

  return movies.map((movie) => {
    const isTheatreExcluded =
      movie.excludedTheatres && movie.excludedTheatres.includes(theatreId);
    const isTheatreIncluded =
      movie.theatres && movie.theatres.includes(theatreId);

    const isActiveForTheatre =
      !isTheatreExcluded &&
      (isTheatreIncluded || movie.excludedTheatres.length === 0);

    return {
      ...movie.toObject(),
      isActive: isActiveForTheatre,
    };
  });
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
  const monday = new Date(today.setDate(diff));
  const sunday = new Date(today.setDate(diff + 6));

  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export const addShow = async (managerId, showData) => {
  const { movie, screen, showTime, language = "English", startDate, endDate, isActive = true } = showData;
  const theatreId = await getManagerTheatre(managerId);

  if (!movie || !screen || !showTime) {
    throw new AppError("Movie, Screen, and Show Time are required", 400);
  }

  const movieDoc = await Movie.findOne({ _id: movie, isActive: true });
  if (!movieDoc) {
    throw new AppError("Movie not found or is inactive", 404);
  }

  const screenDoc = await ScreenTbl.findOne({
    _id: screen,
    theatre: theatreId,
  });

  if (!screenDoc) {
    throw new AppError("Screen not found for this theatre", 404);
  }

  const currentWeek = getCurrentWeekDates();
  const showStartDate = startDate || currentWeek.start;
  const showEndDate = endDate || currentWeek.end;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (new Date(showStartDate) < today || new Date(showEndDate) < today) {
    throw new AppError(
      "Cannot create shows for past dates. Please select today or a future date.",
      400
    );
  }

  const existingShow = await ShowTbls.findOne({
    movie,
    screen,
    showDateTime: new Date(`${showStartDate} ${showTime}`),
    theatre: theatreId,
  });

  if (existingShow) {
    throw new AppError(
      "Show already exists for this time slot and date range",
      409
    );
  }

  const show = await ShowTbls.create({
    movie,
    theatre: theatreId,
    screen,
    showDateTime: new Date(`${showStartDate} ${showTime}`),
    showTime,
    startDate: new Date(showStartDate),
    endDate: new Date(showEndDate),
    language,
    basePrice: 150,
    seatTiers: screenDoc.seatTiers.map((tier) => ({
      tierName: tier.tierName,
      price: tier.price,
      seatsPerRow: tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow,
      rowCount: tier.rows.length,
      totalSeats:
        (tier.seatsPerRow || screenDoc.seatLayout.seatsPerRow) *
        tier.rows.length,
      occupiedSeats: {},
    })),
    totalCapacity: screenDoc.seatLayout.totalSeats,
    isActive,
  });

  await show.populate("movie screen");
  return show;
};

export const getTheatreShows = async (
  managerId,
  movieId = null,
  status = "all"
) => {
  const theatreId = await getManagerTheatre(managerId);

  let query = { theatre: theatreId };

  if (movieId) {
    query.movie = movieId;
  }

  if (status === "upcoming") {
    query.showDateTime = { $gte: new Date() };
  } else if (status === "past") {
    query.showDateTime = { $lt: new Date() };
  }

  const shows = await ShowTbls.find(query)
    .populate("movie", "_id title poster_path overview")
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

  const show = await ShowTbls.findOne({
    _id: showId,
    theatre: theatreId,
  });

  if (!show) {
    throw new AppError("Show not found for this theatre", 404);
  }

  const updatedShow = await ShowTbls.findByIdAndUpdate(showId, updateData, {
    new: true,
  }).populate("movie screen");

  return updatedShow;
};

export const deleteShow = async (managerId, showId) => {
  const theatreId = await getManagerTheatre(managerId);

  const show = await ShowTbls.findOne({
    _id: showId,
    theatre: theatreId,
  });

  if (!show) {
    throw new AppError("Show not found for this theatre", 404);
  }

  await ShowTbls.findByIdAndDelete(showId);

  return { message: "Show deleted successfully" };
};

export const toggleShowStatus = async (managerId, showId, isActive) => {
  const theatreId = await getManagerTheatre(managerId);

  const show = await ShowTbls.findById(showId);

  if (!show) {
    throw new AppError("Show not found", 404);
  }

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

  const totalShows = await ShowTbls.countDocuments({
    theatre: theatreId,
  });

  const theatre = await Theatre.findById(theatreId);

  return {
    activeShows,
    totalShows,
    theatreName: theatre?.name || "N/A",
    theatreCity: theatre?.city || "N/A",
    theatreId,
  };
};

export const repeatShowsForNextWeek = async (
  managerId,
  currentWeekStart,
  currentWeekEnd,
  nextWeekStart,
  nextWeekEnd
) => {
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
      await ShowTbls.create({
        theatre: theatreId,
        movie: show.movie._id,
        screen: show.screen._id,
        showDateTime: new Date(`${nextWeekStart} ${show.showTime}`),
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
