import Movie from "../models/Movie_new.js";
import Show from "../models/Show_new.js";
import Theater from "../models/Theater_new.js";

// Search movies by title, overview, or description
export const searchMovies = async (req, res) => {
  try {
    console.log("[searchMovies] called with query:", req.query);
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Search for movies
    const movies = await Movie.find({
      isDeleted: { $ne: true },
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { overview: searchRegex },
      ],
    })
      .populate("genre_ids", "name")
      .populate("language_id", "name")
      .limit(10);

    // Format the response for frontend
    const movieResults = movies.map((movie) => ({
      type: "movie",
      id: movie._id,
      title: movie.title,
      subtitle: movie.description?.substring(0, 100) + (movie.description?.length > 100 ? "..." : ""),
      image: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average || 0,
      movieData: movie,
    }));

    res.status(200).json({
      success: true,
      movies: movieResults,
      shows: [], // Frontend expects shows array
      totalResults: movieResults.length,
    });
  } catch (error) {
    console.error("[searchMovies] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching movies",
      error: error.message,
    });
  }
};

// Search theatres by name, address, city, or state
export const searchTheatres = async (req, res) => {
  try {
    console.log("[searchTheatres] called with query:", req.query);
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const theatres = await Theater.find({
      isDeleted: { $ne: true },
      approval_status: "approved",
      $or: [
        { name: searchRegex },
        { address: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ],
    })
      .populate("manager_id", "name email phone")
      .limit(10);

    res.status(200).json({
      success: true,
      theatres,
    });
  } catch (error) {
    console.error("[searchTheatres] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching theatres",
      error: error.message,
    });
  }
};

// Combined search for movies and shows (backward compatibility)
export const searchMoviesAndShows = async (req, res) => {
  try {
    console.log("[searchMoviesAndShows] called with query:", req.query);
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Search for movies
    const movies = await Movie.find({
      isDeleted: { $ne: true },
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { overview: searchRegex },
      ],
    })
      .populate("genre_ids", "name")
      .limit(10);

    // Search for shows with matching movies
    const shows = await Show.find({
      isActive: true,
      show_date: { $gte: new Date() },
    })
      .populate({
        path: "movie_id",
        match: {
          isDeleted: { $ne: true },
          $or: [
            { title: searchRegex },
            { description: searchRegex },
          ],
        },
        select: "title description poster_path backdrop_path release_date duration_min",
      })
      .populate("theater_id", "name address city")
      .populate("screen_id", "name")
      .sort({ show_date: 1, show_time: 1 })
      .limit(10);

    // Filter out shows where movie didn't match
    const validShows = shows.filter((show) => show.movie_id);

    // Format the response
    const movieResults = movies.map((movie) => ({
      type: "movie",
      id: movie._id,
      title: movie.title,
      subtitle: movie.description?.substring(0, 100) + (movie.description?.length > 100 ? "..." : ""),
      image: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average || 0,
      movieData: movie,
    }));

    const showResults = validShows.map((show) => ({
      type: "show",
      id: show._id,
      title: `${show.movie_id.title} - ${show.theater_id.name}`,
      subtitle: `${show.theater_id.city} • ${new Date(show.show_date).toLocaleDateString()} ${show.show_time}`,
      image: show.movie_id.poster_path,
      showDateTime: show.show_date,
      movieData: show.movie_id,
      theatreData: show.theater_id,
      showData: show,
    }));

    res.status(200).json({
      success: true,
      movies: movieResults,
      shows: showResults,
      totalResults: movieResults.length + showResults.length,
    });
  } catch (error) {
    console.error("[searchMoviesAndShows] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching movies and shows",
      error: error.message,
    });
  }
};
