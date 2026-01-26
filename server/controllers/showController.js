import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Screen from "../models/Screen.js";
import Theatre from "../models/Theatre.js";
import { inngest } from "../inngest/index.js";

export const getMovieTrailer = async (req, res) => {
  try {
    // Get movie ID from the request parameters, e.g., /api/trailer/1287536
    const { movieId } = req.params;

    // Corrected API call with the api_key as a query parameter
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      }
    );

    // --- Improvement: Find the official trailer ---
    const trailer = data.results.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official === true
    );

    // If no official trailer, find any trailer
    const anyTrailer = data.results.find(
      (video) => video.site === "YouTube" && video.type === "Trailer"
    );

    const videoToSend = trailer || anyTrailer; // Prioritize the official one

    if (videoToSend) {
      // Send back just the YouTube key or the full URL
      const trailerUrl = `https://www.youtube.com/watch?v=${videoToSend.key}`;
      res.status(200).json({
        success: true,
        trailer_url: trailerUrl,
        video_key: videoToSend.key,
      });
    } else {
      // No trailer found
      res
        .status(404)
        .json({ success: false, message: "No trailer found for this movie." });
    }
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
    }
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
      }
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

//API to add a new show to the database (Updated for Theater and Screen)
export const addShow = async (req, res) => {
  try {
    const { movieId, theaterId, screenId, showsInput } = req.body;

    if (!movieId || !theaterId || !screenId || !showsInput) {
      return res.json({
        success: false,
        message: "Please provide movie, theater, screen, and shows data",
      });
    }

    let movie = await Movie.findById(movieId);
    const theater = await Theater.findById(theaterId);
    const screen = await Screen.findById(screenId);

    if (!theater) {
      return res.json({ success: false, message: "Theater not found" });
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
          theater: theaterId,
          screen: screenId,
          showDateTime: showDateTimeUTC,
          seatTiers: JSON.parse(JSON.stringify(initialSeatTiers)),
          totalCapacity: screen.seatLayout.totalSeats,
          occupiedSeatsCount: 0,
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
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

//API to get all shows from the database (with theater and screen info)
export const fetchShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .populate("theater")
      .populate("screen")
      .sort({ showDateTime: 1 });

    //filter unique shows by movie
    const uniqueShows = new Set(shows.map((show) => show.movie));

    res.json({ success: true, shows: Array.from(uniqueShows) });
  } catch (error) {
    console.error("[fetchShows]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all shows for a specific movie (with theater and screen details)
export const fetchShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    })
      .populate("theater")
      .populate("screen")
      .sort({ showDateTime: 1 });

    // Group by theater and screen
    const groupedShows = {};
    shows.forEach((show) => {
      const theaterId = show.theater._id.toString();
      const screenId = show.screen._id.toString();

      if (!groupedShows[theaterId]) {
        groupedShows[theaterId] = {
          theater: show.theater,
          screens: {},
        };
      }

      if (!groupedShows[theaterId].screens[screenId]) {
        groupedShows[theaterId].screens[screenId] = {
          screen: show.screen,
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

//API to get all upcoming movies
export const fetchUpcomingMovies = async (req, res) => {
  try {
    const upcomingMovies = [];

    const { data: firstPage } = await axios.get(
      `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      }
    );

    upcomingMovies.push(...firstPage.results);

    const totalPages = Math.min(firstPage.total_pages, 5);

    for (let page = 2; page <= totalPages; page++) {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        }
      );
      upcomingMovies.push(...data.results);
    }

    const today = new Date().toISOString().split("T")[0];

    // Filter movies that are upcoming and non-adult
    const movies = upcomingMovies.filter(
      (movie) =>
        movie.release_date > today &&
        movie.adult === false &&
        movie.original_language === "en"
    );

    res.json({ success: true, movies });
  } catch (error) {
    console.error("[fetchUpcomingMovies]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get a single show with seat tier information
export const fetchShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId)
      .populate("movie")
      .populate("theater")
      .populate("screen");

    if (!show) {
      return res.json({ success: false, message: "Show not found" });
    }

    res.json({ success: true, show });
  } catch (error) {
    console.error("[fetchShow]", error);
    res.json({ success: false, message: error.message });
  }
};

//API to get show details by movie ID (backward compatibility)
export const fetchShowByMovieId = async (req, res) => {
  try {
    const { movieId } = req.params;

    //get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    }).populate("theater").populate("screen");

    let movie = await Movie.findById(movieId);

    // If movie isn't present in our DB, fetch details from TMDB so frontend
    // (MovieDetails) can render TMDB-only movies as well.
    if (!movie) {
      try {
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

        // Build a movie object shaped like the Movie model so frontend can use it
        movie = {
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
      } catch (tmdbErr) {
        console.error("[fetchShowByMovieId - TMDB fetch]", tmdbErr.message);
        // If TMDB fetch also fails, return movie not found
        return res.json({ success: false, message: "Movie not found" });
      }
    }

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id,
        theater: show.theater,
        screen: show.screen,
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
    // Get all active movies that have shows scheduled in the future
    const futureDate = new Date();
    
    const moviesWithShows = await Show.find({
      showDateTime: { $gte: futureDate },
      isActive: true,
    })
      .distinct("movie")
      .populate("movie");

    // Get details of those movies
    const movies = await Movie.find({
      _id: { $in: moviesWithShows },
      isActive: true,
    }).select(
      "title overview poster_path backdrop_path release_date vote_average runtime genres original_language _id"
    );

    res.json({ success: true, movies, count: movies.length });
  } catch (error) {
    console.error("[getAvailableMoviesForCustomers]", error);
    res.json({ success: false, message: error.message });
  }
};
