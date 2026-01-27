import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { dummyShowsData, dummyTrailers, dummyDateTimeData, dummyTheatersData, dummyBookingData, dummyOccupiedSeats } from "../assets/assets";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthContext.jsx";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [trailer, setTrailer] = useState({});
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const imageBaseURL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user, getAuthHeaders, token } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Reusable error handler
  const handleError = (prefix, error, userMessage) => {
    console.error(`[${prefix}]`, error);
    // If a custom user message was provided, show it.
    if (userMessage) {
      toast.error(userMessage);
      return;
    }

    // Network or connection errors (no response) indicate backend might be down.
    if (!error || !error.response) {
      toast.error("Unable to reach API server. Please ensure the backend is running.");
      return;
    }

    // Otherwise show server-provided message if available.
    const serverMessage = error.response?.data?.message;
    if (serverMessage) toast.error(serverMessage);
  };

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: getAuthHeaders(),
      });

      setIsAdmin(data.isAdmin);

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access the admin dashboard");
      }
    } catch (error) {
      handleError("fetchIsAdmin", error);
    }
  };

  const fetchShows = async () => {
    try {
      // Use dummy data instead of API
      setShows(dummyShowsData);
    } catch (error) {
      handleError("fetchShows", error);
    }
  };

  const fetchUpcomingMovies = async () => {
    try {
      // Use a slice of dummy shows as upcoming movies and add genre_ids for UI
      const movies = dummyShowsData.slice(0, 6).map((m) => ({
        ...m,
        genre_ids: Array.isArray(m.genres) ? m.genres.map((g) => g.id) : [],
      }));
      setUpcomingMovies(movies);
    } catch (error) {
      handleError("fetchUpcomingMovies", error);
    }
  };

  const fetchAllTrailers = async () => {
    if (!upcomingMovies.length) return;

    const trailersMap = { ...trailer };
    upcomingMovies.forEach((movie, idx) => {
      if (!trailersMap[movie.id]) {
        const pick = dummyTrailers[idx % dummyTrailers.length];
        trailersMap[movie.id] = { url: pick.videoUrl, key: null };
      }
    });
    setTrailer(trailersMap);
  };

  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message || "Failed to load favorites");
      }
    } catch (error) {
      handleError("fetchFavoriteMovies", error);
    }
  };

  // Load shows and upcoming movies once
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchShows(), fetchUpcomingMovies()]);
      } catch (error) {
        handleError("InitialLoad", error, "Error loading movies.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Fetch trailers when upcoming movies change
  useEffect(() => {
    fetchAllTrailers();
  }, [upcomingMovies]);

  // Fetch user-based data
  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = {
    // Axios wrapper: intercept movie endpoints to return dummy data,
    // fall back to real axios for everything else.
    axios: {
      get: async (url, config) => {
        try {
          // 1) All movies (listing pages / theatres page)
          if (url === "/api/show/all") {
            return Promise.resolve({ data: { success: true, shows: dummyShowsData.map((m, i) => ({ _id: `dshow-${m.id}-${i}`, movie: m, theater: { _id: dummyTheatersData[0]?.id || "th1" }, showDateTime: Object.values(dummyDateTimeData)[0]?.[0]?.time || new Date().toISOString() })) } });
          }

          // 2) Upcoming movies
          if (url === "/api/show/upcoming-movies") {
            return Promise.resolve({ data: { success: true, movies: dummyShowsData.slice(0, 6) } });
          }

          // 3) Trailer by movie id
          if (url.startsWith("/api/show/trailer/")) {
            const id = url.split("/").pop();
            const index = Math.abs(parseInt(id, 10)) % dummyTrailers.length || 0;
            return Promise.resolve({ data: { success: true, trailer_url: dummyTrailers[index]?.videoUrl || "", video_key: null } });
          }

          // 3b) All movies (manager view)
          if (url === "/api/show/all-movies") {
            return Promise.resolve({ data: { success: true, movies: dummyShowsData } });
          }

          // 4) Movie details by id
          if (/^\/api\/show\/(?!by-movie|trailer|show\/).+/.test(url)) {
            const id = url.split("/").pop();
            const found = dummyShowsData.find((m) => String(m.id) === String(id) || String(m._id) === String(id));
            if (found) {
              return Promise.resolve({ data: { success: true, movie: found, dateTime: dummyDateTimeData } });
            }
            return Promise.resolve({ data: { success: false, message: "Movie not found" } });
          }

          // 5) Grouped shows by movie id
          if (url.startsWith("/api/show/by-movie/")) {
            const id = url.split("/").pop();
            const theatre = dummyTheatersData[0] || { id: "th1", name: "PVR PUNE", location: "PUNE" };
            const theatreId = theatre.id || theatre._id || "th1";

            // Build a minimal groupedShows structure compatible with DateTimePicker/MovieDetails
            const times = Object.values(dummyDateTimeData).flat().map((t) => t.time);
            const showsA = times.filter((_, i) => i % 2 === 0).map((t, i) => ({ _id: `dshow-${id}-a-${i}`, showDateTime: t }));
            const showsB = times.filter((_, i) => i % 2 === 1).map((t, i) => ({ _id: `dshow-${id}-b-${i}`, showDateTime: t }));

            const groupedShows = {
              [theatreId]: {
                theater: { _id: theatreId, name: theatre.name, location: theatre.location },
                screens: {
                  "screen-1": { screen: { screenNumber: 1, seatLayout: { totalSeats: 120 } }, shows: showsA },
                  "screen-2": { screen: { screenNumber: 2, seatLayout: { totalSeats: 80 } }, shows: showsB },
                },
              },
            };

            return Promise.resolve({ data: { success: true, groupedShows } });
          }

          // 6) Show details by show id (SeatLayout_New)
          if (url.startsWith("/api/show/show/")) {
            const showId = url.split("/").pop();
            const movie = dummyShowsData[0];
            const theatre = dummyTheatersData[0] || { id: "th1", name: "PVR PUNE", location: "PUNE" };
            const show = {
              _id: showId,
              movie,
              theater: { name: theatre.name, location: theatre.location },
              screen: { screenNumber: 1, seatLayout: { rows: 10, seatsPerRow: 12, totalSeats: 120 } },
              showDateTime: Object.values(dummyDateTimeData)[0]?.[0]?.time || new Date().toISOString(),
              seatTiers: [
                { tierName: "Standard", price: 150, rows: ["A", "B", "C", "D"] },
                { tierName: "Premium", price: 250, rows: ["E", "F", "G"] },
                { tierName: "VIP", price: 400, rows: ["H", "I", "J"] },
              ],
            };
            return Promise.resolve({ data: { success: true, show } });
          }

          // 7) Admin endpoints - return dummy data
          if (url.startsWith("/api/admin/")) {
            // Admin theatres
            if (url === "/api/admin/theatres") {
              return Promise.resolve({ 
                data: { 
                  success: true, 
                  theatres: dummyTheatersData.map((t, i) => ({ ...t, _id: t.id || `theatre-${i}`, disabled: false })) 
                } 
              });
            }
            
            // Admin movies
            if (url === "/api/admin/movies") {
              return Promise.resolve({ 
                data: { 
                  success: true, 
                  movies: dummyShowsData.map((m, i) => ({ ...m, _id: m.id || `movie-${i}`, disabled: false })) 
                } 
              });
            }
            
            // Admin shows
            if (url === "/api/admin/all-shows") {
              const shows = dummyShowsData.slice(0, 6).map((m, i) => ({
                _id: `show-${i}`,
                movie: m,
                theatre: dummyTheatersData[0],
                screen: { screenNumber: 1, seatLayout: { totalSeats: 120, rows: 10, seatsPerRow: 12 } },
                showDateTime: Object.values(dummyDateTimeData)[0]?.[0]?.time || new Date().toISOString(),
                showPrice: 150 + (i * 25),
                occupiedSeats: dummyOccupiedSeats[`68395b407f6329be2bb45bd${i + 1}`] || {}
              }));
              return Promise.resolve({ data: { success: true, shows } });
            }
            
            // Admin bookings
            if (url === "/api/admin/all-bookings") {
              return Promise.resolve({ 
                data: { 
                  success: true, 
                  bookings: dummyBookingData.map((b, i) => ({ ...b, _id: b._id || `booking-${i}` })) 
                } 
              });
            }
            
            // Admin payments
            if (url === "/api/admin/payments") {
              const payments = dummyBookingData.filter(b => b.isPaid).map((b, i) => ({
                _id: `payment-${i}`,
                transactionId: `txn_${Date.now()}${i}`,
                user: b.user,
                movie: b.show?.movie,
                theatre: b.show?.theater,
                amount: b.amount,
                status: "success",
                method: "Online",
                createdAt: b.createdAt || new Date().toISOString(),
                paidAt: b.createdAt || new Date().toISOString(),
                showDateTime: b.show?.showDateTime,
                seats: b.bookedSeats,
                screenNumber: 1
              }));
              return Promise.resolve({ data: { success: true, payments } });
            }
            
            // Admin dashboard
            if (url === "/api/admin/dashboard-admin") {
              return Promise.resolve({
                data: {
                  success: true,
                  data: {
                    totalTheatres: dummyTheatersData.length,
                    activeUsers: 1250,
                    totalRevenue: dummyBookingData.reduce((sum, b) => sum + (b.amount || 0), 0),
                    totalBookings: dummyBookingData.length
                  }
                }
              });
            }
          }

          // Fallback to real axios
          return await axios.get(url, config);
        } catch (err) {
          throw err;
        }
      },
      post: (...args) => axios.post(...args),
      put: (...args) => axios.put(...args),
      delete: (...args) => axios.delete(...args),
    },
    fetchIsAdmin,
    user,
    getAuthHeaders,
    // Provide a getToken helper for components that expect it.
    getToken: async () => token,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    imageBaseURL,
    upcomingMovies,
    fetchUpcomingMovies,
    loading,
    trailer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
