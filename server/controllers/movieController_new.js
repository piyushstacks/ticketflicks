import Movie from "../models/Movie_new.js";
import Genre from "../models/Genre.js";
import Language from "../models/Language.js";
import Cast from "../models/Cast.js";
import axios from "axios";

// Create new movie
export const createMovie = async (req, res) => {
  try {
    const {
      title,
      genre_ids,
      language_id,
      duration_min,
      release_date,
      description,
      poster_path,
      backdrop_path,
      trailer_link,
      cast,
    } = req.body;

    if (!title || !duration_min || !release_date || !description) {
      return res.json({
        success: false,
        message: "Please provide title, duration_min, release_date, and description",
      });
    }

    const movie = await Movie.create({
      title,
      genre_ids: genre_ids || [],
      language_id: language_id || [],
      duration_min,
      release_date: new Date(release_date),
      description,
      poster_path,
      backdrop_path,
      trailer_link,
      cast: cast || [],
      isDeleted: false,
    });

    await movie.populate("genre_ids language_id cast");

    res.json({
      success: true,
      message: "Movie created successfully",
      movie,
    });
  } catch (error) {
    console.error("[createMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get all movies
export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ isDeleted: false })
      .populate("genre_ids", "name description")
      .populate("language_id", "name code")
      .populate("cast", "name bio")
      .sort({ release_date: -1 });

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[getAllMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get movie by ID
export const getMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId)
      .populate("genre_ids", "name description")
      .populate("language_id", "name code")
      .populate("cast", "name bio dob");

    if (!movie || movie.isDeleted) {
      return res.json({
        success: false,
        message: "Movie not found or deleted",
      });
    }

    res.json({ success: true, movie });
  } catch (error) {
    console.error("[getMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Update movie
export const updateMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const updates = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    Object.keys(updates).forEach((key) => {
      if (key !== "_id") {
        movie[key] = updates[key];
      }
    });

    await movie.save();
    await movie.populate("genre_ids language_id cast");

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

// Soft delete movie
export const deleteMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    movie.isDeleted = true;
    await movie.save();

    res.json({ success: true, message: "Movie soft deleted successfully" });
  } catch (error) {
    console.error("[deleteMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Search movies
export const searchMovies = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: false, message: "Search query required" });
    }

    const movies = await Movie.find({
      isDeleted: false,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
    })
      .populate("genre_ids", "name")
      .limit(20);

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[searchMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Fetch now playing movies from TMDB
export const fetchNowPlayingFromTMDB = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
        params: { language: "en-US", page: 1 },
      }
    );

    res.json({ success: true, movies: data.results });
  } catch (error) {
    console.error("[fetchNowPlayingFromTMDB]", error);
    res.json({ success: false, message: error.message });
  }
};

// Import movie from TMDB
export const importMovieFromTMDB = async (req, res) => {
  try {
    const { tmdbId } = req.params;

    // Fetch movie details
    const [movieRes, creditsRes] = await Promise.all([
      axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }),
      axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/credits`, {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }),
    ]);

    const movieData = movieRes.data;
    const castData = creditsRes.data.cast.slice(0, 10);

    // Create or update cast members
    const castIds = await Promise.all(
      castData.map(async (actor) => {
        let castMember = await Cast.findOne({ name: actor.name });
        if (!castMember) {
          castMember = await Cast.create({
            name: actor.name,
            bio: `Character: ${actor.character}`,
          });
        }
        return castMember._id;
      })
    );

    // Check if movie already exists
    let movie = await Movie.findOne({ title: movieData.title });

    if (!movie) {
      movie = await Movie.create({
        title: movieData.title,
        description: movieData.overview,
        duration_min: movieData.runtime || 120,
        release_date: movieData.release_date,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        trailer_link: null,
        genre_ids: [],
        language_id: [],
        cast: castIds,
        isDeleted: false,
      });
    }

    await movie.populate("cast");

    res.json({ success: true, movie });
  } catch (error) {
    console.error("[importMovieFromTMDB]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createMovie,
  getAllMovies,
  getMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
  fetchNowPlayingFromTMDB,
  importMovieFromTMDB,
};
