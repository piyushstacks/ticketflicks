import Movie from "../models/Movie.js";
import axios from "axios";
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";

// Sync movies from TMDB API
export const syncMoviesFromTMDB = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
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
      const existingMovie = await Movie.findOne({ tmdbId: movie.id });

      if (!existingMovie) {
        moviesToAdd.push({
          title: movie.title,
          tmdbId: movie.id,
          overview: movie.overview,
          poster_path: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null,
          backdrop_path: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
            : null,
          release_date: movie.release_date,
          original_language: movie.original_language,
          vote_average: movie.vote_average,
          genres: movie.genre_ids || [],
          isActive: true,
          addedByAdmin: req.user.id,
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

// Get all available movies for managers
export const getAllAvailableMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isActive: true }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id"
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
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can view all movies",
      });
    }

    const movies = await Movie.find()
      .populate("addedByAdmin", "name email")
      .populate("theatres", "name location");

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
    const movie = await Movie.findById(movieId)
      .populate("addedByAdmin", "name email")
      .populate("theatres", "name location city");

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    res.json({ success: true, movie });
  } catch (error) {
    console.error("[getMovieById]", error);
    res.json({ success: false, message: error.message });
  }
};

// Deactivate movie
export const deactivateMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can deactivate movies",
      });
    }

    const { movieId } = req.params;

    const movie = await Movie.findByIdAndUpdate(
      movieId,
      { isActive: false },
      { new: true }
    );

    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

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

// Update movie
export const updateMovie = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
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

// Assign multiple movies to theatre
export const assignMoviesToTheatre = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can assign movies",
      });
    }

    const { theatreId, movieIds } = req.body;

    if (!theatreId || !movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.json({
        success: false,
        message: "Theatre ID and movie IDs array are required",
      });
    }

    // Verify theatre exists
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    // Verify all movies exist
    const movies = await Movie.find({ _id: { $in: movieIds } });
    if (movies.length !== movieIds.length) {
      return res.json({
        success: false,
        message: "Some movies not found",
      });
    }

    // Add movies to theatre (avoid duplicates)
    const theatre_movies = new Set(theatre.movies?.map(m => m.toString()) || []);
    for (const movieId of movieIds) {
      theatre_movies.add(movieId.toString());
    }

    theatre.movies = Array.from(theatre_movies);
    await theatre.save();

    // Update Movie documents to include theatre
    for (const movieId of movieIds) {
      const movie = await Movie.findById(movieId);
      if (movie && !movie.theatres.includes(theatreId)) {
        movie.theatres.push(theatreId);
        await movie.save();
      }
    }

    const updatedTheatre = await theatre.populate("movies", "title poster_path release_date");

    res.json({
      success: true,
      message: `${movieIds.length} movies assigned to theatre successfully`,
      theatre: updatedTheatre,
    });
  } catch (error) {
    console.error("[assignMoviesToTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Remove movies from theatre
export const removeMoviesFromTheatre = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "admin") {
      return res.json({
        success: false,
        message: "Only admin can remove movies",
      });
    }

    const { theatreId, movieIds } = req.body;

    if (!theatreId || !movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return res.json({
        success: false,
        message: "Theatre ID and movie IDs array are required",
      });
    }

    // Verify theatre exists
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    // Remove movies from theatre
    theatre.movies = theatre.movies.filter(
      m => !movieIds.includes(m.toString())
    );
    await theatre.save();

    // Update Movie documents to remove theatre
    for (const movieId of movieIds) {
      const movie = await Movie.findById(movieId);
      if (movie) {
        movie.theatres = movie.theatres.filter(t => t.toString() !== theatreId);
        await movie.save();
      }
    }

    const updatedTheatre = await theatre.populate("movies", "title poster_path release_date");

    res.json({
      success: true,
      message: `${movieIds.length} movies removed from theatre successfully`,
      theatre: updatedTheatre,
    });
  } catch (error) {
    console.error("[removeMoviesFromTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};
