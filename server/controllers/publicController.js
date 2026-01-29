import Show from "../models/Show.js";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import Screen from "../models/Screen.js";

// Get shows for a specific theatre (public endpoint)
export const getShowsByTheatre = async (req, res) => {
  try {
    const { theatreId } = req.params;

    // Validate theatre exists
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    // Get all shows for this theatre
    const shows = await Show.find({
      theatre: theatreId,
      isActive: true,
      showDateTime: { $gte: new Date() }
    })
    .populate("movie", "title poster_path backdrop_path")
    .populate("theatre", "name location city")
    .populate("screen", "screenNumber name seatTiers")
    .sort({ showDateTime: 1 });

    console.log("Found shows for theatre:", theatreId, shows.length);

    res.json({ success: true, shows });
  } catch (error) {
    console.error("[getShowsByTheatre]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get shows for a specific movie (public endpoint - no auth required)
export const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    // Get all shows for this movie
    const shows = await Show.find({
      movie: movieId,
      isActive: true,
      showDateTime: { $gte: new Date() }
    })
    .populate("theatre", "name location city")
    .populate("screen", "screenNumber name seatLayout seatTiers")
    .populate("movie", "title poster_path backdrop_path")
    .sort({ showDateTime: 1 });

    console.log("Found shows for movie:", movieId, shows.length);

    // Group shows by theatre -> screen -> shows
    const groupedShows = {};
    
    shows.forEach(show => {
      const theatreId = show.theatre._id.toString();
      
      if (!groupedShows[theatreId]) {
        groupedShows[theatreId] = {
          theatre: show.theatre,
          screens: {}
        };
      }
      
      const screenId = show.screen._id.toString();
      
      if (!groupedShows[theatreId].screens[screenId]) {
        groupedShows[theatreId].screens[screenId] = {
          screen: show.screen,
          shows: []
        };
      }
      
      groupedShows[theatreId].screens[screenId].shows.push(show);
    });

    res.json({ 
      success: true, 
      groupedShows,
      movie: movie
    });
  } catch (error) {
    console.error("[getShowsByMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

// Get movie details (public endpoint)
export const getMovieDetails = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    
    if (!movie) {
      return res.json({ success: false, message: "Movie not found" });
    }

    res.json({ success: true, movie });
  } catch (error) {
    console.error("[getMovieDetails]", error);
    res.json({ success: false, message: error.message });
  }
};
