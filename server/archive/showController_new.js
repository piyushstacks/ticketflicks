import axios from "axios";
import mongoose from "mongoose";
import Movie from "../models/Movie_new.js";
import Show from "../models/Show_new.js";
import Screen from "../models/Screen_new.js";
import Theater from "../models/Theater_new.js";
import Seat from "../models/Seat.js";
import { inngest } from "../inngest/index.js";

// API to add a new show to the database (New Schema)
export const addShow = async (req, res) => {
  try {
    const { movie_id, theater_id, screen_id, show_date, seat_ids } = req.body;

    if (!movie_id || !theater_id || !screen_id || !show_date) {
      return res.json({
        success: false,
        message: "Please provide movie_id, theater_id, screen_id, and show_date",
      });
    }

    const movie = await Movie.findById(movie_id);
    const theater = await Theater.findById(theater_id);
    const screen = await Screen.findById(screen_id);

    if (!theater || theater.isDeleted) {
      return res.json({ success: false, message: "Theater not found or deleted" });
    }

    if (!screen || screen.isDeleted) {
      return res.json({ success: false, message: "Screen not found or deleted" });
    }

    if (!movie || movie.isDeleted) {
      return res.json({ success: false, message: "Movie not found or deleted" });
    }

    // Get available seats for this screen if not provided
    let available_seats = seat_ids;
    if (!available_seats || available_seats.length === 0) {
      const seats = await Seat.find({ screen_id });
      available_seats = seats.map(s => s._id);
    }

    const show = await Show.create({
      movie_id,
      theater_id,
      screen_id,
      show_date: new Date(show_date),
      available_seats,
      isActive: true,
    });

    // Trigger inngest event
    await inngest.send({
      name: "app/show.added",
      data: { movieTitle: movie.title },
    });

    res.json({ success: true, message: "Show Added Successfully.", show });
  } catch (error) {
    console.error("[addShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows from the database
export const fetchShows = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shows = await Show.find({
      show_date: { $gte: today },
      isActive: true,
    })
      .populate("movie_id", "title overview poster_path backdrop_path release_date duration_min")
      .populate("theater_id", "name location")
      .populate("screen_id", "name capacity")
      .populate("available_seats")
      .sort({ show_date: 1 });

    const showsWithActiveMovie = shows.filter(
      (show) => show.movie_id && !show.movie_id.isDeleted
    );

    res.json({ success: true, shows: showsWithActiveMovie });
  } catch (error) {
    console.error("[fetchShows]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows for a specific movie
export const fetchShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie_id: movieId,
      show_date: { $gte: new Date() },
      isActive: true,
    })
      .populate("theater_id")
      .populate("screen_id")
      .sort({ show_date: 1 });

    // Group by theater and screen
    const groupedShows = {};
    shows.forEach((show) => {
      const theater = show.theater_id;
      if (!theater) return;
      const theaterId = theater._id.toString();
      const screenId = show.screen_id._id.toString();

      if (!groupedShows[theaterId]) {
        groupedShows[theaterId] = { theater, screens: {} };
      }

      if (!groupedShows[theaterId].screens[screenId]) {
        groupedShows[theaterId].screens[screenId] = {
          screen: show.screen_id,
          shows: [],
        };
      }

      groupedShows[theaterId].screens[screenId].shows.push(show);
    });

    res.json({ success: true, groupedShows });
  } catch (error) {
    console.error("[fetchShowsByMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get a single show
export const fetchShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId)
      .populate("movie_id")
      .populate("theater_id")
      .populate("screen_id")
      .populate("available_seats");

    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    if (show.movie_id && show.movie_id.isDeleted) {
      return res.json({
        success: false,
        message: "This movie is not available for booking",
      });
    }

    res.json({ success: true, show });
  } catch (error) {
    console.error("[fetchShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to update a show
export const updateShow = async (req, res) => {
  try {
    const { showId } = req.params;
    const { show_date, isActive, available_seats } = req.body;

    const show = await Show.findById(showId);
    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    if (show_date) show.show_date = new Date(show_date);
    if (isActive !== undefined) show.isActive = isActive;
    if (available_seats) show.available_seats = available_seats;

    await show.save();

    res.json({ success: true, message: "Show updated successfully", show });
  } catch (error) {
    console.error("[updateShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a show
export const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findByIdAndDelete(showId);
    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    res.json({ success: true, message: "Show deleted successfully" });
  } catch (error) {
    console.error("[deleteShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to toggle show active status
export const toggleShowStatus = async (req, res) => {
  try {
    const { showId } = req.params;
    const { isActive } = req.body;

    const show = await Show.findById(showId);
    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    show.isActive = isActive;
    await show.save();

    res.json({ success: true, message: "Show status updated", show });
  } catch (error) {
    console.error("[toggleShowStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get available movies for customers
// Returns movies with active shows, or all movies if no shows exist
export const getAvailableMovies = async (req, res) => {
  try {
    // Dynamic import Movie model
    const { default: Movie } = await import("../models/Movie_new.js");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // DEBUG: Check which collection Movie model uses
    console.log("[DEBUG] Mongoose connection state:", mongoose.connection.readyState);
    console.log("[DEBUG] Database name:", mongoose.connection.db?.databaseName || "unknown");
    console.log("[DEBUG] Connection host:", mongoose.connection.host || "unknown");
    console.log("[DEBUG] Movie model collection:", Movie.collection?.collectionName || "unknown");
    console.log("[DEBUG] Movie model name:", Movie.modelName || "unknown");

    // Test query
    const modelCount = await Movie.countDocuments();
    console.log("[DEBUG] Mongoose model count:", modelCount);
    const modelCountFiltered = await Movie.countDocuments({ isDeleted: { $ne: true } });
    console.log("[DEBUG] Mongoose filtered count:", modelCountFiltered);
    
    // Native driver test
    const nativeCount = await mongoose.connection.db.collection('movies_new').countDocuments();
    console.log("[DEBUG] Native driver count:", nativeCount);

    const showMovieIds = await Show.find({
      show_date: { $gte: today },
      isActive: true,
    }).distinct("movie_id");

    let movies;
    let source;

    console.log("[getAvailableMovies] showMovieIds:", showMovieIds.length);

    if (showMovieIds.length > 0) {
      // Return movies that have active shows
      movies = await Movie.find({
        _id: { $in: showMovieIds },
        isDeleted: { $ne: true },
      }).select("title overview poster_path backdrop_path release_date duration_min");
      source = "shows";
    } else {
      // No shows exist yet - return all movies so they display on website
      console.log("[getAvailableMovies] No shows found, returning all movies");
      const allMoviesCount = await Movie.countDocuments({ isDeleted: { $ne: true } });
      console.log("[getAvailableMovies] Total movies in DB:", allMoviesCount);
      movies = await Movie.find({
        isDeleted: { $ne: true },
      }).select("title overview poster_path backdrop_path release_date duration_min");
      console.log("[getAvailableMovies] Retrieved movies:", movies.length);
      source = "all_movies";
    }

    res.json({ success: true, movies, count: movies.length, source });
  } catch (error) {
    console.error("[getAvailableMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  addShow,
  fetchShows,
  fetchShowsByMovie,
  fetchShow,
  updateShow,
  deleteShow,
  toggleShowStatus,
  getAvailableMovies,
};
