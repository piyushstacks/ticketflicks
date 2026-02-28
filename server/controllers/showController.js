import * as showService from "../services/showService.js";
import { asyncHandler } from "../services/errorService.js";

export const getMovieTrailer = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const trailer = await showService.getMovieTrailer(movieId);
  res.status(200).json({ success: true, ...trailer });
});

export const fetchNowPlayingMovies = asyncHandler(async (req, res) => {
  const movies = await showService.fetchNowPlayingMovies();
  res.json({ success: true, movies });
});

export const addShow = asyncHandler(async (req, res) => {
  const { movieId, theatreId, screenId, showsInput } = req.body;
  const result = await showService.addShow(
    movieId,
    theatreId,
    screenId,
    showsInput
  );
  res.status(201).json(result);
});

export const fetchShows = asyncHandler(async (req, res) => {
  const shows = await showService.fetchShows();
  res.json({ success: true, shows });
});

export const fetchShowsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const groupedShows = await showService.fetchShowsByMovie(movieId);
  res.json({ success: true, groupedShows });
});

export const fetchUpcomingMovies = asyncHandler(async (req, res) => {
  const movies = await showService.fetchUpcomingMovies();
  res.json({ success: true, movies });
});

export const fetchShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const show = await showService.fetchShow(showId);
  res.json({ success: true, show });
});

export const fetchShowByMovieId = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const result = await showService.fetchShowByMovieId(movieId);
  res.json({ success: true, ...result });
});

export const getAvailableMoviesForCustomers = asyncHandler(
  async (req, res) => {
    const result = await showService.getAvailableMoviesForCustomers();
    res.json({ success: true, ...result });
  }
);

export const getAllActiveMovies = asyncHandler(async (req, res) => {
  const result = await showService.getAllActiveMovies();
  res.json({ success: true, ...result });
});

export const getAllShowsDebug = asyncHandler(async (req, res) => {
  const result = await showService.getAllShowsDebug();
  res.json({ success: true, ...result });
});

export const searchMoviesAndShows = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const result = await showService.searchMoviesAndShows(q);
  res.status(200).json({ success: true, ...result });
});

export const updateShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const show = await showService.updateShow(showId, req.body);
  res.json({ success: true, show });
});

export const deleteShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const show = await showService.cancelShow(showId);
  res.json({ success: true, show });
});

export const toggleShowStatus = asyncHandler(async (req, res) => {
  const { showId } = req.params;
  const { isActive } = req.body;
  // If isActive is provided, use it directly; otherwise toggle current state
  let newStatus;
  if (typeof isActive === 'boolean') {
    newStatus = isActive;
  } else {
    const currentShow = await showService.fetchShow(showId);
    newStatus = !currentShow.isActive;
  }
  const show = await showService.updateShow(showId, { isActive: newStatus });
  res.json({ success: true, message: `Show ${newStatus ? 'activated' : 'deactivated'} successfully`, show });
});

export const getAvailableMovies = getAvailableMoviesForCustomers;

export const getAllMoviesForManager = asyncHandler(async (req, res) => {
  // Return ALL active movies for managers/admins to schedule shows
  const movies = await showService.fetchUpcomingMovies();
  res.json({ success: true, movies });
});

export default {
  getMovieTrailer,
  fetchNowPlayingMovies,
  addShow,
  fetchShows,
  fetchShowsByMovie,
  fetchUpcomingMovies,
  fetchShow,
  fetchShowByMovieId,
  getAvailableMoviesForCustomers,
  getAllActiveMovies,
  getAllShowsDebug,
  searchMoviesAndShows,
  updateShow,
  deleteShow,
  toggleShowStatus,
  getAvailableMovies,
  getAllMoviesForManager,
};
