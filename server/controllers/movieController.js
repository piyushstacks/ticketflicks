/**
 * Movie Controller
 * Handles movie operations
 */

import movieService from "../services/movieService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Get all movies
 */
export const getAllMovies = asyncHandler(async (req, res) => {
  const { title, skip = 0, limit = 50 } = req.query;
  const filters = title ? { title } : {};
  const result = await movieService.getAllMovies(
    filters,
    Number(skip),
    Number(limit)
  );
  res.json({ success: true, ...result });
});

/**
 * Get movie by ID
 */
export const getMovieById = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const movie = await movieService.getMovieById(movieId);
  res.json({ success: true, movie });
});

/**
 * Create movie (admin only)
 */
export const createMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.createMovie(req.body);
  res.status(201).json({ success: true, movie });
});

/**
 * Update movie (admin only)
 */
export const updateMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const movie = await movieService.updateMovie(movieId, req.body);
  res.json({ success: true, message: "Movie updated", movie });
});

/**
 * Delete movie (admin only)
 */
export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const result = await movieService.deleteMovie(movieId);
  res.json({ success: true, ...result });
});

/**
 * Search movies
 */
export const searchMovies = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const movies = await movieService.searchMovies(q);
  res.json({ success: true, movies });
});

export default {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  searchMovies,
};
