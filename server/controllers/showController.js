import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/show_tbls.js";
import Screen from "../models/Screen.js";
import Theatre from "../models/Theatre.js";
import { inngest } from "../inngest/index.js";

export const getMovieTrailer = async (req, res) => {
  try {
    // Get movie ID from the request parameters, e.g., /api/trailer/1287536
    const { movieId } = req.params;

    // Use predefined trailer data instead of TMDB API
    // These are our "database" trailers for demo purposes
    const databaseTrailers = [
      {
        video_key: "WpW36ldAqnM",
        trailer_url: "https://www.youtube.com/watch?v=WpW36ldAqnM",
      },
      {
        video_key: "-sAOWhvheK8",
        trailer_url: "https://www.youtube.com/watch?v=-sAOWhvheK8",
      },
      {
        video_key: "1pHDWnXmK7Y",
        trailer_url: "https://www.youtube.com/watch?v=1pHDWnXmK7Y",
      },
      {
        video_key: "umiKiW4En9g",
        trailer_url: "https://www.youtube.com/watch?v=umiKiW4En9g",
      },
    ];

    // Select a trailer based on movie ID (cyclic selection for demo)
    const trailerIndex =
      parseInt(movieId.slice(-1), 16) % databaseTrailers.length;
    const selectedTrailer = databaseTrailers[trailerIndex];

    res.status(200).json({
      success: true,
      trailer_url: selectedTrailer.trailer_url,
      video_key: selectedTrailer.video_key,
    });
  } catch (error) {
    // --- Proper Error Handling ---
    console.error("[GET MOVIE TRAILER]", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const fetchAllNowPlayingMovies = async () => {
  const allMovies = [];

  const { data: firstPage } = await axios.get(
    `https://api.themoviedb.org/3/movie/now_playing`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
      },
    },
  );

  allMovies.push(...firstPage.results);

  const totalPages = Math.min(firstPage.total_pages, 5); // up to 5 pages

  for (let page = 2; page <= totalPages; page++) {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      },
    );
    allMovies.push(...data.results);
  }
  return allMovies;
};

//API to get Now-Playing Movies
export const fetchNowPlayingMovies = async (req, res) => {
  try {
    const movies = await fetchAllNowPlayingMovies();
    res.json({ success: true, movies });
  } catch (error) {
    console.error("[fetchNowPlayingMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to add a new show to the database (Updated for Theatre and Screen)
export const addShow = async (req, res) => {
  try {
    const { movieId, theatreId, screenId, showsInput } = req.body;

    if (!movieId || !theatreId || !screenId || !showsInput) {
      return res.json({
        success: false,
        message: "Please provide movie, theatre, screen, and shows data",
      });
    }

    let movie = await Movie.findById(movieId);
    const theatre = await Theatre.findById(theatreId);
    const screen = await ScreenTbl.findById(screenId);

    if (!theatre) {
      return res.json({ success: false, message: "Theatre not found" });
    }

    if (!screen) {
      return res.json({ success: false, message: "Screen not found" });
    }

    if (!movie) {
      // Fetch movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),

        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      const movieDetailsData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieDetailsData.title,
        overview: movieDetailsData.overview,
        poster_path: movieDetailsData.poster_path,
        backdrop_path: movieDetailsData.backdrop_path,
        genres: movieDetailsData.genres,
        casts: movieCreditsData.cast,
        release_date: movieDetailsData.release_date,
        original_language: movieDetailsData.original_language,
        tagline: movieDetailsData.tagline || "",
        vote_average: movieDetailsData.vote_average,
        runtime: movieDetailsData.runtime,
      };

      // Add movie to DB
      movie = await Movie.create(movieDetails);
    }

    const { fromZonedTime } = await import("date-fns-tz");
    const showsToCreate = [];
    const timeZone = "Asia/Kolkata";

    // Initialize seat tiers with empty occupied seats
    const initialSeatTiers = screen.seatTiers.map((tier) => ({
      tierName: tier.tierName,
      price: tier.price,
      occupiedSeats: {},
    }));

    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        const showDateTimeUTC = fromZonedTime(dateTimeString, timeZone);
        showsToCreate.push({
          movie: movieId,
          theatre: theatreId,
          screen: screenId,
          showDateTime: showDateTimeUTC,
          seatTiers: JSON.parse(JSON.stringify(initialSeatTiers)),
          totalCapacity: screen.seatLayout.totalSeats,
          occupiedSeatsCount: 0,
        });
      });
    });

    if (showsToCreate.length > 0) {
      await ShowTbls.insertMany(showsToCreate);
    }

    // Trigger inngest event
    await inngest.send({
      name: "app/show.added",
      data: {
        movieTitle: movie.title,
      },
    });

    res.json({ success: true, message: "Show Added Successfully." });
  } catch (error) {
    console.error("[addShow]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows from the database – only active movies that have future shows (Now Showing)
export const fetchShows = async (req, res) => {
  try {
    // Get current date and set time to beginning of day to include today's shows
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const shows = await Show.find({
      show_date: { $gte: today },
      isActive: true,
    })
      .populate(
        "movie_id",
        "title overview poster_path backdrop_path release_date vote_average runtime genres isActive reviews _id",
      )
      .populate("theater_id")
      .populate("screen_id")
      .sort({ show_date: 1 });

    // Only include shows where the movie exists and is active (not disabled by admin)
    const showsWithActiveMovie = shows.filter(
      (show) => show.movie && show.movie.isActive !== false,
    );
    const uniqueMovies = [
      ...new Set(showsWithActiveMovie.map((s) => s.movie).filter(Boolean)),
    ];

    res.json({ success: true, shows: uniqueMovies });
  } catch (error) {
    console.error("[fetchShows]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows for a specific movie (with theatre and screen details)
export const fetchShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie_id: movieId,
      show_date: { $gte: new Date() },
    })
      .populate("theater_id")
      .populate("screen_id")
      .sort({ show_date: 1 });

    // Group by theatre and screen (Show model uses "theater_id")
    const groupedShows = {};
    shows.forEach((show) => {
      const theatre = show.theater_id;
      if (!theatre) return;
      const theatreId = theatre._id.toString();
      const screenId = show.screen_id._id.toString();

      if (!groupedShows[theatreId]) {
        groupedShows[theatreId] = {
          theatre,
          screens: {},
        };
      }

      if (!groupedShows[theatreId].screens[screenId]) {
        groupedShows[theatreId].screens[screenId] = {
          screen: show.screen_id,
          shows: [],
        };
      }

      groupedShows[theatreId].screens[screenId].shows.push(show);
    });

    res.json({ success: true, groupedShows });
  } catch (error) {
    console.error("[fetchShowsByMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all upcoming movies from database
export const fetchUpcomingMovies = async (req, res) => {
  try {
    const today = new Date();

    // Fetch upcoming movies from our database (movie_tbls collection)
    // Since all our current movies are from 2025 and today is 2026,
    // we'll fetch the most recent movies as upcoming for demo purposes
    const upcomingMovies = await Movie.find({
      isActive: true, // Only active movies
    })
      .sort({ release_date: -1 }) // Sort by newest first
      .limit(20) // Limit to 20 movies
      .select(
        "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id",
      );

    // Format the response to match the expected structure
    const movies = upcomingMovies.map((movie) => ({
      ...movie.toObject(),
      id: movie._id, // Map _id to id for consistency with frontend
      genre_ids: movie.genres ? movie.genres.map((g) => g.id) : [],
      adult: false, // Assume all our movies are non-adult
      original_language: movie.original_language || "en",
    }));

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[fetchUpcomingMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get a single show with seat tier information – reject if movie is disabled
export const fetchShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId)
      .populate("movie_id")
      .populate("theater_id")
      .populate("screen_id");

    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }
    if (show.movie_id && show.movie_id.isActive === false) {
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

// API to get show details by movie ID (backward compatibility) – only if movie is active
export const fetchShowByMovieId = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.json({
        success: false,
        message: "Movie not found in database",
      });
    }
    if (!movie.isActive) {
      return res.json({ success: true, movie, dateTime: {} });
    }

    const shows = await Show.find({
      movie_id: movieId,
      show_date: { $gte: new Date() },
    })
      .populate("theater_id")
      .populate("screen_id");

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.show_date.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({
        time: show.show_date,
        showId: show._id,
        theatre: show.theater_id,
        screen: show.screen_id,
        seatTiers: show.seatTiers,
      });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error("[fetchShowByMovieId]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all available movies for customers (public endpoint)
export const getAvailableMoviesForCustomers = async (req, res) => {
  try {
    // Get all active movies that have shows scheduled in the future or today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moviesWithShows = await Show.find({
      show_date: { $gte: today },
      isActive: true,
    })
      .distinct("movie_id")
      .populate("movie_id");

    const movies = await Movie.find({
      _id: { $in: moviesWithShows },
      isActive: true,
    }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id",
    );

    res.json({ success: true, movies, count: movies.length });
  } catch (error) {
    console.error("[getAvailableMoviesForCustomers]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get movies for Now Showing – only active movies that have at least one future show (fallback when /all returns empty)
export const getAllActiveMovies = async (req, res) => {
  try {
    // Get current date and set time to beginning of day to include today's shows
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const movieIdsWithShows = await ShowTbls.find({
      showDateTime: { $gte: today },
      isActive: true,
    }).distinct("movie");

    const movies = await Movie.find({
      _id: { $in: movieIdsWithShows },
      isActive: true,
    }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id",
    );

    res.json({ success: true, movies, count: movies.length });
  } catch (error) {
    console.error("[getAllActiveMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

// Debug API to get all shows regardless of date (for troubleshooting)
export const getAllShowsDebug = async (req, res) => {
  try {
    const shows = await Show.find({ isActive: true })
      .populate("movie_id")
      .populate("theater_id")
      .populate("screen_id")
      .sort({ show_date: 1 });

    const currentDate = new Date();
    const futureShows = shows.filter(show => new Date(show.show_date) >= currentDate);
    const pastShows = shows.filter(show => new Date(show.show_date) < currentDate);

    res.json({ 
      success: true, 
      totalShows: shows.length,
      futureShows: futureShows.length,
      pastShows: pastShows.length,
      shows: shows,
      currentDate: currentDate.toISOString()
    });
  } catch (error) {
    console.error("[getAllShowsDebug]", error);
    res.json({ success: false, message: error.message });
  }
};

// API to search movies and shows
export const searchMoviesAndShows = async (req, res) => {
  try {
    console.log('Search movies/shows called with query:', req.query);
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i'); // Case-insensitive search

    // Search for movies by title, overview, or genre
    const movies = await Movie.find({
      isActive: true,
      $or: [
        { title: searchRegex },
        { overview: searchRegex },
        { tagline: searchRegex }
      ]
    }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id",
    ).limit(10);

    // Search for shows that have matching movies
    const shows = await ShowTbls.find({
      isActive: true,
      showDateTime: { $gte: new Date() },
    })
      .populate({
        path: "movie",
        match: {
          isActive: true,
          $or: [
            { title: searchRegex },
            { overview: searchRegex },
            { tagline: searchRegex }
          ]
        },
        select: "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id"
      })
      .populate("theatre", "name address city")
      .populate("screen", "screenName")
      .sort({ showDateTime: 1 })
      .limit(10);

    // Filter out shows where movie didn't match
    const validShows = shows.filter(show => show.movie);

    // Format the response
    const movieResults = movies.map(movie => ({
      type: 'movie',
      id: movie._id,
      title: movie.title,
      subtitle: movie.overview?.substring(0, 100) + (movie.overview?.length > 100 ? '...' : ''),
      image: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      movieData: movie
    }));

    const showResults = validShows.map(show => ({
      type: 'show',
      id: show._id,
      title: `${show.movie.title} - ${show.theatre.name}`,
      subtitle: `${show.theatre.city} • ${new Date(show.showDateTime).toLocaleString()}`,
      image: show.movie.poster_path,
      showDateTime: show.showDateTime,
      movieData: show.movie,
      theatreData: show.theatre,
      showData: show
    }));

    res.status(200).json({
      success: true,
      movies: movieResults,
      shows: showResults,
      totalResults: movieResults.length + showResults.length
    });
  } catch (error) {
    console.error("Error searching movies and shows:", error);
    res.status(500).json({
      success: false,
      message: "Error searching movies and shows",
      error: error.message,
    });
  }
};
