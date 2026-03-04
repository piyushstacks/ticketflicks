import * as showService from "../services/showService.js";
import { asyncHandler } from "../services/errorService.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";

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
  // 1. Find the manager's theatre to get their disabled movie list
  const managerId = req.user?.id || req.user?._id;
  let disabledMovieIds = [];
  if (managerId) {
    const theatre = await Theatre.findOne({ manager_id: managerId }).select("disabledMovies").lean();
    disabledMovieIds = (theatre?.disabledMovies || []).map(id => id.toString());
  }

  // 2. Fetch ALL globally-active movies from DB
  const movies = await Movie.find({ isActive: true })
    .select("title overview description poster_path backdrop_path release_date vote_average runtime duration_min genres genre_ids original_language isActive _id")
    .sort({ title: 1 })
    .lean();

  // 3. Annotate each movie with whether it is enabled for THIS theatre
  const annotated = movies.map(m => ({
    ...m,
    // Global status (admin controlled)
    globallyActive: m.isActive,
    // Per-theatre override — if in disabledMovies it is disabled here
    isActive: !disabledMovieIds.includes(m._id.toString()),
    isEnabledForTheatre: !disabledMovieIds.includes(m._id.toString()),
  }));

  res.json({ success: true, movies: annotated });
});

/**
 * PATCH /api/show/movies/:movieId
 * Toggle a movie on/off for the manager's own theatre only.
 * Does NOT touch the global Movie.isActive — that is admin-only.
 */
export const toggleMovieForTheatre = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const { isActive } = req.body; // true = enable, false = disable
  const managerId = req.user?.id || req.user?._id;

  const theatre = await Theatre.findOne({ manager_id: managerId });
  if (!theatre) {
    return res.status(400).json({ success: false, message: "No theatre assigned to this manager" });
  }

  const disabledSet = new Set((theatre.disabledMovies || []).map(id => id.toString()));

  if (isActive) {
    // Enable: remove from disabled list
    disabledSet.delete(movieId);
  } else {
    // Disable: add to disabled list
    disabledSet.add(movieId);
  }

  theatre.disabledMovies = Array.from(disabledSet);
  await theatre.save();

  const action = isActive ? "enabled" : "disabled";
  res.json({ success: true, message: `Movie ${action} for your theatre` });
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
  toggleMovieForTheatre,
};
