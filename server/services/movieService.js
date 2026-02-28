/**
 * Movie Service
 * Handles movie operations
 */

import Movie from "../models/Movie.js";
import { NotFoundError, ValidationError } from "./errorService.js";
import { validateDescription } from "./validationService.js";

/**
 * Get all movies
 */
export const getAllMovies = async (filters = {}, skip = 0, limit = 50) => {
  const query = {};

  if (filters.title) {
    query.title = { $regex: filters.title, $options: "i" };
  }

  if (filters.releaseDateMin) {
    query.release_date = { $gte: new Date(filters.releaseDateMin) };
  }

  if (filters.releaseDateMax) {
    if (!query.release_date) query.release_date = {};
    query.release_date.$lte = new Date(filters.releaseDateMax);
  }

  const movies = await Movie.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ release_date: -1 });

  const total = await Movie.countDocuments(query);

  return {
    movies: movies.map((m) => ({
      id: m._id.toString(),
      title: m.title,
      description: m.description,
      duration: m.duration_min,
      releaseDate: m.release_date,
      poster: m.poster_path,
      backdrop: m.backdrop_path,
      trailer: m.trailer_link,
      rating: m.imdbRating,
      reviews: m.reviewCount,
    })),
    pagination: {
      total,
      skip,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get movie by ID
 */
export const getMovieById = async (movieId) => {
  const movie = await Movie.findById(movieId)
    .populate("genre_ids", "name")
    .populate("language_id", "name")
    .populate("cast", "name role");

  if (!movie) {
    throw new NotFoundError("Movie");
  }

  return {
    id: movie._id.toString(),
    title: movie.title,
    description: movie.description,
    duration: movie.duration_min,
    releaseDate: movie.release_date,
    poster: movie.poster_path,
    backdrop: movie.backdrop_path,
    trailer: movie.trailer_link,
    genres: movie.genre_ids || [],
    languages: movie.language_id || [],
    cast: movie.cast || [],
    rating: movie.imdbRating,
    reviews: movie.reviewCount,
  };
};

/**
 * Create a new movie
 */
export const createMovie = async (movieData) => {
  const { title, description, duration, releaseDate, poster, backdrop, trailer } = movieData;

  // Validate required fields
  if (!title || !description || !duration || !releaseDate) {
    throw new ValidationError("Title, description, duration, and release date are required");
  }

  const descriptionValidation = validateDescription(description);
  if (!descriptionValidation.valid) {
    throw new ValidationError(descriptionValidation.message);
  }

  if (duration < 1) {
    throw new ValidationError("Duration must be at least 1 minute");
  }

  // Check if movie already exists
  const existingMovie = await Movie.findOne({ title });
  if (existingMovie) {
    throw new ValidationError("Movie with this title already exists");
  }

  const movie = await Movie.create({
    title: title.trim(),
    description: description.trim(),
    duration_min: duration,
    release_date: new Date(releaseDate),
    poster_path: poster || null,
    backdrop_path: backdrop || null,
    trailer_link: trailer || null,
    genre_ids: [],
    language_id: [],
    cast: [],
  });

  return {
    id: movie._id.toString(),
    title: movie.title,
    description: movie.description,
    duration: movie.duration_min,
    releaseDate: movie.release_date,
  };
};

/**
 * Update movie
 */
export const updateMovie = async (movieId, updates) => {
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new NotFoundError("Movie");
  }

  // Update allowed fields
  if (updates.title) {
    const existingMovie = await Movie.findOne({
      title: updates.title,
      _id: { $ne: movieId },
    });
    if (existingMovie) {
      throw new ValidationError("Movie title already exists");
    }
    movie.title = updates.title.trim();
  }

  if (updates.description) {
    const descriptionValidation = validateDescription(updates.description);
    if (!descriptionValidation.valid) {
      throw new ValidationError(descriptionValidation.message);
    }
    movie.description = updates.description.trim();
  }

  if (updates.duration_min) {
    if (updates.duration_min < 1) {
      throw new ValidationError("Duration must be at least 1 minute");
    }
    movie.duration_min = updates.duration_min;
  }

  if (updates.release_date) {
    movie.release_date = new Date(updates.release_date);
  }

  if (updates.poster_path !== undefined) movie.poster_path = updates.poster_path;
  if (updates.backdrop_path !== undefined) movie.backdrop_path = updates.backdrop_path;
  if (updates.trailer_link !== undefined) movie.trailer_link = updates.trailer_link;
  if (updates.imdbRating !== undefined) movie.imdbRating = updates.imdbRating;

  await movie.save();

  return {
    id: movie._id.toString(),
    title: movie.title,
    description: movie.description,
    duration: movie.duration_min,
    releaseDate: movie.release_date,
    poster: movie.poster_path,
  };
};

/**
 * Delete movie (soft delete)
 */
export const deleteMovie = async (movieId) => {
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new NotFoundError("Movie");
  }

  movie.isDeleted = true;
  await movie.save();

  return { success: true, message: "Movie deleted successfully" };
};

/**
 * Search movies
 */
export const searchMovies = async (query) => {
  if (!query || query.trim().length === 0) {
    throw new ValidationError("Search query is required");
  }

  const movies = await Movie.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  })
    .limit(20)
    .select("title poster_path release_date");

  return movies.map((m) => ({
    id: m._id.toString(),
    title: m.title,
    poster: m.poster_path,
    releaseDate: m.release_date,
  }));
};

export default {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
};
