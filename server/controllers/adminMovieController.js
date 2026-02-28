import Movie from "../models/Movie.js";
import ShowNew from "../models/show_tbls.js";
import RatingsReview from "../models/RatingsReview.js";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import Screen from "../models/Screen.js";

// Create new movie (admin only)
export const createMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can create movies" });
    }

    const {
      title,
      description,
      overview,
      poster_path,
      backdrop_path,
      trailer_link,
      trailer_path,
      release_date,
      language_id,
      original_language,
      genre_ids,
      genres,
      cast,
      casts,
      duration_min,
      runtime,
      tagline,
      reviews,
      vote_average,
      imdbRating,
    } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Movie title is required" });
    }

    if (!release_date) {
      return res.status(400).json({ success: false, message: "Release date is required" });
    }

    const releaseDateObj = new Date(release_date);
    if (isNaN(releaseDateObj.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid release date format" });
    }

    // Check for duplicate title
    const existingMovie = await Movie.findOne({ title: title.trim() });
    if (existingMovie) {
      return res.status(409).json({ success: false, message: "A movie with this title already exists" });
    }

    const movieOverview = overview || description || "";
    const movieRuntime = runtime || duration_min || 120;
    const movieTrailer = trailer_link || trailer_path || null;

    const newMovie = new Movie({
      title: title.trim(),
      description: movieOverview,
      overview: movieOverview,
      poster_path: poster_path || null,
      backdrop_path: backdrop_path || null,
      trailer_link: movieTrailer,
      trailer_path: movieTrailer,
      release_date: releaseDateObj,
      language_id: language_id || [],
      original_language: original_language || "en",
      genre_ids: genre_ids || [],
      genres: genres || [],
      cast: cast || [],
      casts: casts || [],
      duration_min: movieRuntime,
      runtime: movieRuntime,
      tagline: tagline || "",
      reviews: reviews || [],
      vote_average: vote_average || imdbRating || null,
      imdbRating: imdbRating || vote_average || null,
      isActive: true,
      isDeleted: false,
    });

    await newMovie.save();

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie: newMovie,
    });
  } catch (error) {
    console.error("[createMovie]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all movies (admin view only)
export const getAllMovies = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can view all movies" });
    }

    const movies = await Movie.find({}).setOptions({ includeDeleted: false });
    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAllMovies]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all available movies for managers (all active movies in DB)
export const getAllAvailableMovies = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== "manager" && user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Only managers or admins can view available movies" });
    }

    const movies = await Movie.find({ isActive: true }).select(
      "title overview description poster_path backdrop_path release_date duration_min runtime genre_ids genres original_language isActive _id trailer_link trailer_path vote_average"
    );

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAllAvailableMovies]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single movie by ID
export const getMovieById = async (req, res) => {
  try {
    const { movieId, id } = req.params;
    const mid = movieId || id;
    const movie = await Movie.findById(mid);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }
    res.json({ success: true, movie });
  } catch (error) {
    console.error("[getMovieById]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update movie (admin only)
export const updateMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can update movies" });
    }

    const { movieId } = req.params;
    const updates = { ...req.body };

    // Keep both field names in sync
    if (updates.overview !== undefined) updates.description = updates.overview;
    if (updates.description !== undefined && !updates.overview) updates.overview = updates.description;
    if (updates.runtime !== undefined) updates.duration_min = updates.runtime;
    if (updates.duration_min !== undefined && !updates.runtime) updates.runtime = updates.duration_min;
    if (updates.trailer_link !== undefined) updates.trailer_path = updates.trailer_link;
    if (updates.trailer_path !== undefined && !updates.trailer_link) updates.trailer_link = updates.trailer_path;

    const movie = await Movie.findByIdAndUpdate(movieId, updates, {
      new: true,
      runValidators: false,
    });

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    res.json({ success: true, message: "Movie updated successfully", movie });
  } catch (error) {
    console.error("[updateMovie]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Deactivate movie (soft delete)
export const deactivateMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can deactivate movies" });
    }

    const { movieId } = req.params;
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    // Deactivate all shows for this movie
    await ShowNew.updateMany({ movie: movieId }, { isActive: false });

    res.json({ success: true, message: "Movie deactivated successfully", movie });
  } catch (error) {
    console.error("[deactivateMovie]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Activate movie
export const activateMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can activate movies" });
    }

    const { movieId } = req.params;
    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { isDeleted: false, isActive: true },
      { new: true }
    );

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    res.json({ success: true, message: "Movie activated successfully", movie });
  } catch (error) {
    console.error("[activateMovie]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get movies by theatre (admin view)
export const getMoviesByTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;
    const shows = await ShowNew.find({ theatre: theatreId, isActive: true })
      .populate("movie", "title description overview poster_path backdrop_path release_date duration_min runtime")
      .select("movie showDateTime");

    const moviesMap = new Map();
    shows.forEach((show) => {
      if (show.movie && !moviesMap.has(show.movie._id.toString())) {
        moviesMap.set(show.movie._id.toString(), { ...show.movie.toObject(), showDates: [] });
      }
      if (show.movie) {
        moviesMap.get(show.movie._id.toString()).showDates.push(show.showDateTime);
      }
    });

    const movies = Array.from(moviesMap.values());
    res.json({ success: true, movies, count: movies.length });
  } catch (error) {
    console.error("[getMoviesByTheatre]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Schedule a movie at a theatre (create a show)  
export const scheduleMovieAtTheatre = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admin can schedule movies" });
    }

    const { movieId, theatreId, screenId, showDate, availableSeats } = req.body;

    if (!movieId || !theatreId || !screenId || !showDate) {
      return res.status(400).json({ success: false, message: "Movie ID, Theatre ID, Screen ID, and Show Date are required" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) return res.status(404).json({ success: false, message: "Theatre not found" });
    if (theatre.approval_status !== "approved") {
      return res.status(400).json({ success: false, message: "Movies can only be scheduled at approved theatres" });
    }

    const screen = await Screen.findById(screenId);
    if (!screen) return res.status(404).json({ success: false, message: "Screen not found" });

    const showDateObj = new Date(showDate);
    if (isNaN(showDateObj.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid show date format" });
    }

    const newShow = new ShowNew({
      movie: movieId,
      theatre: theatreId,
      screen: screenId,
      showDateTime: showDateObj,
      isActive: true,
    });

    await newShow.save();
    res.json({ success: true, message: "Movie scheduled successfully at theatre", show: newShow });
  } catch (error) {
    console.error("[scheduleMovieAtTheatre]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove movie schedule
export const removeMovieSchedule = async (req, res) => {
  try {
    const { showId } = req.params;
    const show = await ShowNew.findByIdAndUpdate(showId, { isActive: false }, { new: true });
    if (!show) return res.status(404).json({ success: false, message: "Show not found" });
    res.json({ success: true, message: "Movie schedule removed successfully", show });
  } catch (error) {
    console.error("[removeMovieSchedule]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get movie reviews
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId).select("title");
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    const reviews = await RatingsReview.find({ movie_id: movieId })
      .populate("user_id", "name")
      .sort({ createdAt: -1 });

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      reviews,
      movieTitle: movie.title,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("[getMovieReviews]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add review  
export const addMovieReview = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { userId, rating, review } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ success: false, message: "User ID and rating are required" });
    }
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 0 and 5" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

    const newReview = new RatingsReview({ movie_id: movieId, user_id: userId, rating, review: review || "" });
    await newReview.save();

    res.json({ success: true, message: "Review added successfully", review: newReview });
  } catch (error) {
    console.error("[addMovieReview]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update review
export const updateMovieReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;

    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 0 and 5" });
    }

    const updatedReview = await RatingsReview.findByIdAndUpdate(reviewId, { rating, review }, { new: true });
    if (!updatedReview) return res.status(404).json({ success: false, message: "Review not found" });

    res.json({ success: true, message: "Review updated successfully", review: updatedReview });
  } catch (error) {
    console.error("[updateMovieReview]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review
export const deleteMovieReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deletedReview = await RatingsReview.findByIdAndDelete(reviewId);
    if (!deletedReview) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("[deleteMovieReview]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stub / legacy aliases
export const syncMoviesFromTMDB = async (req, res) => {
  res.status(410).json({ success: false, message: "TMDB sync disabled. Use manual movie creation instead." });
};

export const excludeTheatresFromMovie = async (req, res) => {
  res.status(410).json({ success: false, message: "Use scheduleMovieAtTheatre and removeMovieSchedule instead" });
};

export const includeTheatresForMovie = async (req, res) => {
  res.status(410).json({ success: false, message: "Use scheduleMovieAtTheatre and removeMovieSchedule instead" });
};

export const assignMoviesToTheatre = async (req, res) => {
  res.status(410).json({ success: false, message: "Use scheduleMovieAtTheatre instead" });
};

export const removeMoviesFromTheatre = async (req, res) => {
  res.status(410).json({ success: false, message: "Use removeMovieSchedule instead" });
};

export const addMovieReviews = addMovieReview;
export const updateMovieReviews = updateMovieReview;

export const deleteMovie = async (req, res) => {
  return deactivateMovie(req, res);
};

export const searchMovies = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, movies: [] });
    const movies = await Movie.find({
      isActive: true,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { overview: { $regex: q, $options: "i" } },
      ],
    }).limit(20);
    res.json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const fetchNowPlayingFromTMDB = async (req, res) => {
  res.status(410).json({ success: false, message: "TMDB integration disabled. Movies are managed by admin." });
};

export const importMovieFromTMDB = async (req, res) => {
  res.status(410).json({ success: false, message: "TMDB integration disabled. Movies are managed by admin." });
};

export default {
  syncMoviesFromTMDB,
  getMoviesByTheatre,
  scheduleMovieAtTheatre,
  removeMovieSchedule,
  createMovie,
  updateMovie,
  getAllMovies,
  getMovieById,
  deactivateMovie,
  activateMovie,
  updateMovieReviews,
  deleteMovieReview,
  getMovieReviews,
  addMovieReview,
  updateMovieReview,
  getAllAvailableMovies,
  deleteMovie,
  searchMovies,
  fetchNowPlayingFromTMDB,
  importMovieFromTMDB,
};
