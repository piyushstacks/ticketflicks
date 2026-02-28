import ShowTbls from "../models/show_tbls.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import ScreenTbl from "../models/ScreenTbl.js";
import youtubeService from "../services/youtubeService.js";

// Fetch and update movie trailer from YouTube
const fetchAndUpdateTrailer = async (movie) => {
  try {
    // Use stored trailer if available
    const storedTrailer = movie.trailer_link || movie.trailer_path;
    if (storedTrailer && youtubeService.isValidYouTubeUrl(storedTrailer)) {
      return storedTrailer;
    }

    // Only fetch from YouTube if no trailer stored and YouTube API key exists
    if (process.env.YOUTUBE_API_KEY) {
      const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
      const trailerUrl = await youtubeService.searchMovieTrailer(movie.title, year);

      if (trailerUrl) {
        await Movie.findByIdAndUpdate(movie._id, {
          trailer_link: trailerUrl,
          trailer_path: trailerUrl
        });
        console.log(`Updated trailer for movie: ${movie.title}`);
        return trailerUrl;
      }
    }
    return storedTrailer || null;
  } catch (error) {
    console.error(`Error fetching trailer for ${movie.title}:`, error);
    return movie.trailer_link || movie.trailer_path || null;
  }
};

// Get shows for a specific theatre (public endpoint)
export const getShowsByTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;

    // Validate theatre exists and is approved
    const theatre = await Theatre.findOne({
      _id: theatreId,
      approval_status: 'approved',
      disabled: { $ne: true }
    });
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found or not available" });
    }

    // Get all shows for this theatre – only for active (non-disabled) movies
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const shows = await ShowTbls.find({
      theatre: theatreId,
      isActive: true,
      showDateTime: { $gte: startOfToday }
    })
      .populate("movie", "title poster_path backdrop_path isActive")
      .populate("theatre", "name location city")
      .populate("screen", "screenNumber name seatTiers")
      .sort({ showDateTime: 1 });

    console.log("Total shows found for theatre:", theatreId, shows.length);

    // Debug: Log each show and its movie status
    shows.forEach((show, index) => {
      console.log(`Show ${index + 1}:`, {
        showId: show._id,
        movieId: show.movie?._id,
        movieTitle: show.movie?.title,
        movieIsActive: show.movie?.isActive,
        showDateTime: show.showDateTime
      });
    });

    const showsForActiveMovies = shows.filter(
      (s) => s.movie && s.movie.isActive === true
    );

    console.log("Shows for active movies:", theatreId, showsForActiveMovies.length);

    res.json({ success: true, shows: showsForActiveMovies });
  } catch (error) {
    console.error("[getShowsByTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get shows for a specific movie (public endpoint - no auth required)
export const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movie exists and is active (not disabled by admin)
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }
    if (movie.isActive === false) {
      return res.json({
        success: true,
        groupedShows: {},
        movie,
        message: "This movie is not currently available for booking.",
      });
    }

    // Get all shows for this movie (only from approved theatres)
    // A show is valid if its endDate is today or in the future,
    // OR if it has no endDate but showDateTime >= today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const shows = await ShowTbls.find({
      movie: movieId,
      isActive: true,
      $or: [
        { endDate: { $gte: startOfToday } },              // has endDate and it's today or future
        { endDate: null, showDateTime: { $gte: startOfToday } }, // no endDate, showDateTime >= today
        { endDate: { $exists: false }, showDateTime: { $gte: startOfToday } } // field absent
      ]
    })
      .populate({
        path: "theatre",
        match: { approval_status: 'approved', disabled: { $ne: true } },
        select: "name location city"
      })
      .populate("screen", "screenNumber name seatLayout seatTiers")
      .populate("movie", "title poster_path backdrop_path")
      .sort({ showDateTime: 1 });

    console.log("Found shows for movie:", movieId, shows.length);

    // Filter out shows with null theatres (due to populate match)
    const validShows = shows.filter(show => show.theatre != null);
    console.log("Valid shows after filtering:", validShows.length);

    // Group shows by theatre -> screen -> shows
    const groupedShows = {};

    validShows.forEach(show => {
      const theatreId = show.theatre._id.toString();

      if (!groupedShows[theatreId]) {
        groupedShows[theatreId] = {
          theatre: show.theatre,
          screens: {}
        };
      }

      const screenId = show.screen._id.toString();

      if (!groupedShows[theatreId].screens[screenId]) {
        groupedShows[theatreId].screens[screenId] = {
          screen: show.screen,
          shows: []
        };
      }

      groupedShows[theatreId].screens[screenId].shows.push(show);
    });

    res.json({
      success: true,
      groupedShows,
      movie: movie
    });
  } catch (error) {
    console.error("[getShowsByMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get movie details (public endpoint)
export const getMovieDetails = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    // Fetch trailer if not available
    const trailerUrl = await fetchAndUpdateTrailer(movie);

    // Return updated movie data
    const updatedMovie = await Movie.findById(movieId);

    res.json({ success: true, movie: updatedMovie });
  } catch (error) {
    console.error("[getMovieDetails]", error);
    res.json({ success: false, message: error.message });
  }
};

// Stub functions for genre routes
export const createGenre = async (req, res) => {
  res.status(501).json({ success: false, message: "Genre management not implemented" });
};
export const getAllGenres = async (req, res) => {
  res.status(501).json({ success: false, message: "Genre listing not implemented" });
};
export const updateGenre = async (req, res) => {
  res.status(501).json({ success: false, message: "Genre update not implemented" });
};
export const deleteGenre = async (req, res) => {
  res.status(501).json({ success: false, message: "Genre deletion not implemented" });
};

// Stub functions for language routes
export const createLanguage = async (req, res) => {
  try {
    const Language = (await import('../models/Language.js')).default;
    const { name, code, region } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required' });
    const lang = await Language.create({ name: name.trim(), code: code.trim().toLowerCase(), region });
    res.status(201).json({ success: true, language: lang });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Language already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getAllLanguages = async (req, res) => {
  try {
    const Language = (await import('../models/Language.js')).default;
    const languages = await Language.find().sort({ name: 1 });
    res.json({ success: true, languages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const updateLanguage = async (req, res) => {
  try {
    const Language = (await import('../models/Language.js')).default;
    const lang = await Language.findByIdAndUpdate(req.params.languageId, req.body, { new: true, runValidators: true });
    if (!lang) return res.status(404).json({ success: false, message: 'Language not found' });
    res.json({ success: true, language: lang });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteLanguage = async (req, res) => {
  try {
    const Language = (await import('../models/Language.js')).default;
    const lang = await Language.findByIdAndDelete(req.params.languageId);
    if (!lang) return res.status(404).json({ success: false, message: 'Language not found' });
    res.json({ success: true, message: 'Language deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stub functions for cast routes
export const createCast = async (req, res) => {
  res.status(501).json({ success: false, message: "Cast management not implemented" });
};
export const getAllCast = async (req, res) => {
  res.status(501).json({ success: false, message: "Cast listing not implemented" });
};
export const updateCast = async (req, res) => {
  res.status(501).json({ success: false, message: "Cast update not implemented" });
};
export const deleteCast = async (req, res) => {
  res.status(501).json({ success: false, message: "Cast deletion not implemented" });
};

// Default export
export default {
  getShowsByMovie,
  getMovieDetails,
  createGenre,
  getAllGenres,
  updateGenre,
  deleteGenre,
  createLanguage,
  getAllLanguages,
  updateLanguage,
  deleteLanguage,
  createCast,
  getAllCast,
  updateCast,
  deleteCast,
};
