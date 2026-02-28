import Movie from "../models/Movie.js";
import Show from "../models/show_tbls.js";
import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import { inngest } from "../inngest/index.js";
import { AppError } from "./errorService.js";

export const getMovieTrailer = async (movieId) => {
  // Try to get trailer from DB first
  try {
    const movie = await Movie.findById(movieId);
    if (movie) {
      const trailerUrl = movie.trailer_link || movie.trailer_path;
      if (trailerUrl) {
        // Extract YouTube video key from URL
        const match = trailerUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        if (match) {
          return {
            video_key: match[1],
            trailer_url: trailerUrl,
          };
        }
      }
    }
  } catch (e) {
    console.error("[getMovieTrailer] DB lookup error:", e.message);
  }

  // Fallback: use a placeholder
  const databaseTrailers = [
    { video_key: "WpW36ldAqnM", trailer_url: "https://www.youtube.com/watch?v=WpW36ldAqnM" },
    { video_key: "-sAOWhvheK8", trailer_url: "https://www.youtube.com/watch?v=-sAOWhvheK8" },
    { video_key: "1pHDWnXmK7Y", trailer_url: "https://www.youtube.com/watch?v=1pHDWnXmK7Y" },
    { video_key: "umiKiW4En9g", trailer_url: "https://www.youtube.com/watch?v=umiKiW4En9g" },
  ];
  const trailerIndex = parseInt(movieId.slice(-1), 16) % databaseTrailers.length;
  return databaseTrailers[trailerIndex];
};

// Kept for backward compat but not used for home page anymore
export const fetchNowPlayingMovies = async () => {
  const movies = await Movie.find({ isActive: true })
    .sort({ release_date: -1 })
    .limit(20)
    .select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id");
  return movies;
};

export const addShow = async (movieId, theatreId, screenId, showsInput) => {
  if (!movieId || !theatreId || !screenId || !showsInput) {
    throw new AppError("Please provide movie, theatre, screen, and shows data", 400);
  }

  const theatre = await Theatre.findById(theatreId);
  const screen = await ScreenTbl.findById(screenId);

  if (!theatre) throw new AppError("Theatre not found", 404);
  if (!screen) throw new AppError("Screen not found", 404);

  // Movie must exist in DB (no TMDB fetching)
  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError("Movie not found. Only admin can add movies to the database.", 404);

  const { fromZonedTime } = await import("date-fns-tz");
  const showsToCreate = [];
  const timeZone = "Asia/Kolkata";

  const initialSeatTiers = screen.seatTiers.map((tier) => ({
    tierName: tier.tierName,
    price: tier.price,
    occupiedSeats: {},
  }));

  showsInput.forEach((show) => {
    const showDate = show.date;
    show.time.forEach((time) => {
      const dateTimeString = `${showDate}T${time}`;
      const showDateTimeUTC = fromZonedTime(dateTimeString, timeZone);
      showsToCreate.push({
        movie: movieId,
        theatre: theatreId,
        screen: screenId,
        showDateTime: showDateTimeUTC,
        seatTiers: JSON.parse(JSON.stringify(initialSeatTiers)),
        totalCapacity: screen.seatLayout.totalSeats,
        occupiedSeatsCount: 0,
      });
    });
  });

  if (showsToCreate.length > 0) {
    await Show.insertMany(showsToCreate, { timestamps: false });
  }

  try {
    await inngest.send({ name: "app/show.added", data: { movieTitle: movie.title } });
  } catch (e) {
    console.warn("[addShow] Inngest send failed:", e.message);
  }

  return { success: true, message: "Show Added Successfully." };
};

export const fetchShows = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all shows with future show times
  const shows = await Show.find({
    showDateTime: { $gte: today },
    isActive: true,
  })
    .populate("movie", "title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language isActive reviews _id trailer_link trailer_path")
    .populate("theatre")
    .populate("screen")
    .sort({ showDateTime: 1 });

  // Filter out shows with inactive movies or null movies
  const showsWithActiveMovie = shows.filter(
    (show) => show.movie && show.movie.isActive !== false
  );

  // Get unique movies from shows (deduplicated)
  const uniqueMoviesMap = new Map();
  showsWithActiveMovie.forEach((show) => {
    if (show.movie && show.movie._id) {
      const id = show.movie._id.toString();
      if (!uniqueMoviesMap.has(id)) {
        uniqueMoviesMap.set(id, show.movie);
      }
    }
  });

  return Array.from(uniqueMoviesMap.values());
};

export const fetchShowsByMovie = async (movieId) => {
  const shows = await Show.find({
    movie: movieId,
    showDateTime: { $gte: new Date() },
  })
    .populate("theatre")
    .populate("screen")
    .sort({ showDateTime: 1 });

  const groupedShows = {};
  shows.forEach((show) => {
    const theatre = show.theatre;
    if (!theatre) return;
    const theatreId = theatre._id.toString();
    const screenId = show.screen._id.toString();

    if (!groupedShows[theatreId]) {
      groupedShows[theatreId] = { theatre, screens: {} };
    }
    if (!groupedShows[theatreId].screens[screenId]) {
      groupedShows[theatreId].screens[screenId] = { screen: show.screen, shows: [] };
    }
    groupedShows[theatreId].screens[screenId].shows.push(show);
  });

  return groupedShows;
};

export const fetchUpcomingMovies = async () => {
  const upcomingMovies = await Movie.find({ isActive: true })
    .sort({ release_date: -1 })
    .limit(20)
    .select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id trailer_link trailer_path");

  return upcomingMovies.map((movie) => ({
    ...movie.toObject(),
    id: movie._id,
    // Normalize field names for frontend consumption
    overview: movie.overview || movie.description || "",
    runtime: movie.runtime || movie.duration_min || 120,
    genre_ids: Array.isArray(movie.genres) ? movie.genres.map((g) => g.id).filter(Boolean) : [],
    adult: false,
    original_language: movie.original_language || "en",
  }));
};

export const fetchShow = async (showId) => {
  const show = await Show.findById(showId)
    .populate("movie")
    .populate("theatre")
    .populate("screen");

  if (!show) throw new AppError("Show not found", 404);
  if (show.movie && show.movie.isActive === false) {
    throw new AppError("This movie is not available for booking", 400);
  }
  return show;
};

export const fetchShowByMovieId = async (movieId) => {
  const movie = await Movie.findById(movieId);
  if (!movie) throw new AppError("Movie not found in database", 404);
  if (!movie.isActive) return { movie, dateTime: {} };

  const shows = await Show.find({ movie: movieId, showDateTime: { $gte: new Date() } })
    .populate("theatre")
    .populate("screen");

  const dateTime = {};
  shows.forEach((show) => {
    const date = show.showDateTime.toISOString().split("T")[0];
    if (!dateTime[date]) dateTime[date] = [];
    dateTime[date].push({
      time: show.showDateTime,
      showId: show._id,
      theatre: show.theatre,
      screen: show.screen,
      seatTiers: show.seatTiers,
    });
  });

  return { movie, dateTime };
};

export const getAvailableMoviesForCustomers = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const moviesWithShows = await Show.find({
    showDateTime: { $gte: today },
    isActive: true,
  }).distinct("movie");

  const movies = await Movie.find({
    _id: { $in: moviesWithShows },
    isActive: true,
  }).select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id trailer_link trailer_path");

  // Normalize for frontend
  const normalized = movies.map(m => ({
    ...m.toObject(),
    overview: m.overview || m.description || "",
    runtime: m.runtime || m.duration_min || 120,
  }));

  return { movies: normalized, count: normalized.length };
};

export const getAllActiveMovies = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const movieIdsWithShows = await Show.find({
    showDateTime: { $gte: today },
    isActive: true,
  }).distinct("movie");

  const movies = await Movie.find({
    _id: { $in: movieIdsWithShows },
    isActive: true,
  }).select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id trailer_link trailer_path");

  const normalized = movies.map(m => ({
    ...m.toObject(),
    overview: m.overview || m.description || "",
    runtime: m.runtime || m.duration_min || 120,
  }));

  return { movies: normalized, count: normalized.length };
};

export const getAllShowsDebug = async () => {
  const shows = await Show.find({ isActive: true })
    .populate("movie")
    .populate("theatre")
    .populate("screen")
    .sort({ showDateTime: 1 });

  const currentDate = new Date();
  const futureShows = shows.filter((show) => new Date(show.showDateTime) >= currentDate);
  const pastShows = shows.filter((show) => new Date(show.showDateTime) < currentDate);

  return { totalShows: shows.length, futureShows: futureShows.length, pastShows: pastShows.length, shows, currentDate: currentDate.toISOString() };
};

export const searchMoviesAndShows = async (query) => {
  if (!query || !query.trim()) throw new AppError("Search query is required", 400);

  const searchRegex = new RegExp(query.trim(), "i");

  const movies = await Movie.find({
    isActive: true,
    $or: [
      { title: searchRegex },
      { overview: searchRegex },
      { description: searchRegex },
    ],
  })
    .select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id")
    .limit(10);

  const shows = await Show.find({ isActive: true, showDateTime: { $gte: new Date() } })
    .populate({
      path: "movie",
      match: { isActive: true, $or: [{ title: searchRegex }, { overview: searchRegex }] },
      select: "title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language _id",
    })
    .populate("theatre", "name address city")
    .populate("screen", "screenName")
    .sort({ showDateTime: 1 })
    .limit(10);

  const validShows = shows.filter((show) => show.movie);

  const movieResults = movies.map((movie) => ({
    type: "movie",
    id: movie._id,
    title: movie.title,
    subtitle: (movie.overview || movie.description || "").substring(0, 100),
    image: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    movieData: movie,
  }));

  const showResults = validShows.map((show) => ({
    type: "show",
    id: show._id,
    title: `${show.movie.title} - ${show.theatre?.name}`,
    subtitle: `${show.theatre?.city} • ${new Date(show.showDateTime).toLocaleString()}`,
    image: show.movie.poster_path,
    showDateTime: show.showDateTime,
    movieData: show.movie,
    theatreData: show.theatre,
    showData: show,
  }));

  return {
    movies: movieResults,
    shows: showResults,
    totalResults: movieResults.length + showResults.length,
  };
};

export const updateShow = async (showId, updateData) => {
  const show = await Show.findByIdAndUpdate(showId, updateData, { new: true, runValidators: false });
  if (!show) throw new AppError("Show not found", 404);
  return show;
};

export const cancelShow = async (showId) => {
  const show = await Show.findByIdAndUpdate(
    showId,
    { status: "cancelled", isActive: false },
    { new: true }
  );
  if (!show) throw new AppError("Show not found", 404);
  return show;
};
