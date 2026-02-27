import Movie from "../models/Movie_new.js";
import ShowNew from "../models/Show_new.js";
import RatingsReview from "../models/RatingsReview.js";
import axios from "axios";
import User from "../models/User.js";
import UserNew from "../models/User_new.js";
import Theatre from "../models/Theatre.js";
import Screen from "../models/Screen.js";

// Sync movies from TMDB API
export const syncMoviesFromTMDB = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can add movies",
      });
    }

    const { page = 1, searchQuery = "" } = req.body;
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_BASE_URL = "https://api.themoviedb.org/3";

    if (!TMDB_API_KEY) {
      return res.json({
        success: false,
        message: "TMDB API key not configured",
      });
    }

    let tmdbUrl = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;

    if (searchQuery) {
      tmdbUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&page=${page}`;
    }

    const { data: tmdbData } = await axios.get(tmdbUrl);

    const moviesToAdd = [];

    for (const movie of tmdbData.results) {
      const existingMovie = await Movie.findOne({ title: movie.title });

      if (!existingMovie) {
        // Map genre_ids from TMDB - for now store as empty, would need Genre model lookup
        moviesToAdd.push({
          title: movie.title,
          description: movie.overview || "",
          poster_path: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          backdrop_path: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : null,
          release_date: movie.release_date ? new Date(movie.release_date) : new Date(),
          // Language and genre would need to be mapped to ObjectIds
          language_id: [], // Would need Language model lookup
          genre_ids: [], // Would need Genre model lookup from genre_ids array
          duration_min: movie.runtime || 120,
          cast: [], // Would need Cast model
          isDeleted: false,
        });
      }
    }

    if (moviesToAdd.length > 0) {
      await Movie.insertMany(moviesToAdd);
    }

    res.json({
      success: true,
      message: `${moviesToAdd.length} new movies added from TMDB`,
      moviesAdded: moviesToAdd.length,
      totalResults: tmdbData.total_results,
      totalPages: tmdbData.total_pages,
      currentPage: page,
    });
  } catch (error) {
    console.error("[syncMoviesFromTMDB]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get movies playing at a specific theatre (via Show_new model)
export const getMoviesByTheatre = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can view movies by theatre",
      });
    }

    const { theatreId } = req.params;

    // Find all shows for this theatre
    const shows = await ShowNew.find({ theater_id: theatreId, isActive: true })
      .populate("movie_id", "title description poster_path backdrop_path release_date duration_min")
      .select("movie_id show_date");

    // Extract unique movies
    const moviesMap = new Map();
    shows.forEach((show) => {
      if (show.movie_id && !moviesMap.has(show.movie_id._id.toString())) {
        moviesMap.set(show.movie_id._id.toString(), {
          ...show.movie_id.toObject(),
          showDates: [],
        });
      }
      if (show.movie_id) {
        moviesMap.get(show.movie_id._id.toString()).showDates.push(show.show_date);
      }
    });

    const movies = Array.from(moviesMap.values());

    res.json({
      success: true,
      movies,
      count: movies.length,
    });
  } catch (error) {
    console.error("[getMoviesByTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Schedule a movie at a theatre (create a show)
export const scheduleMovieAtTheatre = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can schedule movies",
      });
    }

    const { movieId, theatreId, screenId, showDate, availableSeats } = req.body;

    if (!movieId || !theatreId || !screenId || !showDate) {
      return res.json({
        success: false,
        message: "Movie ID, Theatre ID, Screen ID, and Show Date are required",
      });
    }

    // Verify movie exists
    const movie = await Movie.findById(movieId);
    if (!movie || movie.isDeleted) {
      return res.json({
        success: false,
        message: "Movie not found or has been deleted",
      });
    }

    // Verify theatre exists and is approved
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({
        success: false,
        message: "Theatre not found",
      });
    }
    if (theatre.approval_status !== "approved") {
      return res.json({
        success: false,
        message: "Movies can only be scheduled at approved theatres",
      });
    }

    // Verify screen exists
    const screen = await Screen.findById(screenId);
    if (!screen) {
      return res.json({
        success: false,
        message: "Screen not found",
      });
    }

    // Create the show
    const showDateObj = new Date(showDate);
    if (isNaN(showDateObj.getTime())) {
      return res.json({
        success: false,
        message: "Invalid show date format",
      });
    }

    const newShow = new ShowNew({
      movie_id: movieId,
      theater_id: theatreId,
      screen_id: screenId,
      show_date: showDateObj,
      available_seats: availableSeats || [],
      isActive: true,
    });

    await newShow.save();

    res.json({
      success: true,
      message: "Movie scheduled successfully at theatre",
      show: newShow,
    });
  } catch (error) {
    console.error("[scheduleMovieAtTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove a movie schedule from a theatre
export const removeMovieSchedule = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can remove movie schedules",
      });
    }

    const { showId } = req.params;

    const show = await ShowNew.findByIdAndUpdate(
      showId,
      { isActive: false },
      { new: true }
    );

    if (!show) {
      return res.json({
        success: false,
        message: "Show not found",
      });
    }

    res.json({
      success: true,
      message: "Movie schedule removed successfully",
      show,
    });
  } catch (error) {
    console.error("[removeMovieSchedule]", error);
    res.json({ success: false, message: error.message });
  }
};

// Create new movie
export const createMovie = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can create movies",
      });
    }

    const {
      title,
      description,
      poster_path,
      backdrop_path,
      trailer_link,
      release_date,
      language_id,
      genre_ids,
      cast,
      duration_min,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.json({
        success: false,
        message: "Movie title is required",
      });
    }

    if (!release_date) {
      return res.json({
        success: false,
        message: "Release date is required",
      });
    }

    // Validate date format
    const releaseDateObj = new Date(release_date);
    if (isNaN(releaseDateObj.getTime())) {
      return res.json({
        success: false,
        message: "Invalid release date format",
      });
    }

    // Check for duplicate title
    const existingMovie = await Movie.findOne({
      title: title.trim(),
      isDeleted: false,
    });

    if (existingMovie) {
      return res.json({
        success: false,
        message: "A movie with this title already exists",
      });
    }

    // Validate duration if provided
    if (duration_min && (isNaN(duration_min) || duration_min <= 0)) {
      return res.json({
        success: false,
        message: "Duration must be a positive number",
      });
    }

    // Create movie
    const newMovie = new Movie({
      title: title.trim(),
      description: description || "",
      poster_path: poster_path || "",
      backdrop_path: backdrop_path || "",
      trailer_link: trailer_link || "",
      release_date: releaseDateObj,
      language_id: language_id || [],
      genre_ids: genre_ids || [],
      cast: cast || [],
      duration_min: duration_min || 120,
      isDeleted: false,
    });

    await newMovie.save();

    res.json({
      success: true,
      message: "Movie created successfully",
      movie: newMovie,
    });
  } catch (error) {
    console.error("[createMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Legacy compatibility - redirects to new methods
export const excludeTheatresFromMovie = async (req, res) => {
  return res.json({
    success: false,
    message: "Use scheduleMovieAtTheatre and removeMovieSchedule instead",
  });
};

export const includeTheatresForMovie = async (req, res) => {
  return res.json({
    success: false,
    message: "Use scheduleMovieAtTheatre and removeMovieSchedule instead",
  });
};

// Get all available movies for managers
export const getAllAvailableMovies = async (req, res) => {
  try {
    // Get the current user (manager)
    const manager = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!manager || manager.role !== "manager") {
      return res.json({
        success: false,
        message: "Only managers can view available movies",
      });
    }

    // Get manager's theatre ID
    const managerTheatreId = manager.managedTheatreId;
    if (!managerTheatreId) {
      return res.json({
        success: false,
        message: "Manager is not assigned to any theatre",
      });
    }

    // Find movies that are not deleted
    // Note: Movie-theatre relationships would be handled through a separate model in new schema
    const movies = await Movie.find({
      isDeleted: false,
    }).select(
      "title description poster_path backdrop_path release_date duration_min genre_ids _id",
    );

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAllAvailableMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all movies (admin view)
export const getAllMovies = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can view all movies",
      });
    }

    console.log(`[getAllMovies] Querying collection: ${Movie.collection.name}`);
    const movies = await Movie.find({ isDeleted: false });
    console.log(`[getAllMovies] Found ${movies.length} movies from ${Movie.collection.name}`);

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAllMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get single movie
export const getMovieById = async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    res.json({ success: true, movie });
  } catch (error) {
    console.error("[getMovieById]", error);
    res.json({ success: false, message: error.message });
  }
};

// Deactivate movie (soft delete)
export const deactivateMovie = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can deactivate movies",
      });
    }

    const { movieId } = req.params;

    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { isDeleted: true },
      { new: true },
    );

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    // Also deactivate all shows for this movie
    await ShowNew.updateMany(
      { movie_id: movieId },
      { isActive: false }
    );

    res.json({
      success: true,
      message: "Movie deactivated successfully",
      movie,
    });
  } catch (error) {
    console.error("[deactivateMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Activate movie (restore from soft delete)
export const activateMovie = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can activate movies",
      });
    }

    const { movieId } = req.params;

    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { isDeleted: false },
      { new: true },
    );

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    res.json({
      success: true,
      message: "Movie activated successfully",
      movie,
    });
  } catch (error) {
    console.error("[activateMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update movie
export const updateMovie = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can update movies",
      });
    }

    const { movieId } = req.params;
    const updates = req.body;

    const movie = await Movie.findByIdAndUpdate(movieId, updates, {
      new: true,
    });

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    res.json({
      success: true,
      message: "Movie updated successfully",
      movie,
    });
  } catch (error) {
    console.error("[updateMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Legacy compatibility - redirects to new methods
export const assignMoviesToTheatre = async (req, res) => {
  return res.json({
    success: false,
    message: "Use scheduleMovieAtTheatre instead",
  });
};

export const removeMoviesFromTheatre = async (req, res) => {
  return res.json({
    success: false,
    message: "Use removeMovieSchedule instead",
  });
};

export const addMovieReviews = async (req, res) => {
  return res.json({
    success: false,
    message: "Use addMovieReview instead",
  });
};

export const updateMovieReviews = async (req, res) => {
  return res.json({
    success: false,
    message: "Use updateMovieReview instead",
  });
};

// Delete a review
export const deleteMovieReview = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can delete reviews",
      });
    }

    const { reviewId } = req.params;

    const deletedReview = await RatingsReview.findByIdAndDelete(reviewId);

    if (!deletedReview) {
      return res.json({ success: false, message: "Review not found" });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[deleteMovieReview]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get movie reviews with ratings (from RatingsReview model)
export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId).select("title");
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

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
    res.json({ success: false, message: error.message });
  }
};

// Add a review to a movie
export const addMovieReview = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can add reviews",
      });
    }

    const { movieId } = req.params;
    const { userId, rating, review } = req.body;

    if (!userId || !rating) {
      return res.json({
        success: false,
        message: "User ID and rating are required",
      });
    }

    if (rating < 0 || rating > 5) {
      return res.json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    const newReview = new RatingsReview({
      movie_id: movieId,
      user_id: userId,
      rating,
      review: review || "",
    });

    await newReview.save();

    res.json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("[addMovieReview]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update a review
export const updateMovieReview = async (req, res) => {
  try {
    const admin = (await UserNew.findById(req.user.id)) || (await User.findById(req.user.id));
    if (!admin || admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can update reviews",
      });
    }

    const { reviewId } = req.params;
    const { rating, review } = req.body;

    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    const updatedReview = await RatingsReview.findByIdAndUpdate(
      reviewId,
      { rating, review },
      { new: true }
    );

    if (!updatedReview) {
      return res.json({ success: false, message: "Review not found" });
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    console.error("[updateMovieReview]", error);
    res.json({ success: false, message: error.message });
  }
};
