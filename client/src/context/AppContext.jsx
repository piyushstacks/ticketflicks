import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthContext.jsx";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";
axios.defaults.baseURL = baseURL;

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
  
  console.log("[AppContext] RENDER - user from AuthContext:", user?.email, "token exists:", !!token);

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
      console.log("[AppContext] Fetching shows from /api/show/all...");
      // First try to get shows (movies with future showtimes)
      const { data } = await axios.get("/api/show/all");
      console.log("[AppContext] Shows API response:", data);
      
      if (data.success && data.shows && data.shows.length > 0) {
        console.log("[AppContext] Setting shows:", data.shows);
        setShows(data.shows || []);
      } else {
        console.log("[AppContext] No shows found, falling back to movies...");
        // If no shows exist, fall back to getting all active movies
        const moviesResponse = await axios.get("/api/show/movies");
        console.log("[AppContext] Movies API response:", moviesResponse.data);
        
        if (moviesResponse.data.success && moviesResponse.data.movies) {
          setShows(moviesResponse.data.movies);
        } else {
          setShows([]);
        }
      }
    } catch (error) {
      console.error("[AppContext] Error fetching shows:", error);
      handleError("fetchShows", error);
      // On error, try fallback to movies
      try {
        const moviesResponse = await axios.get("/api/show/movies");
        if (moviesResponse.data.success && moviesResponse.data.movies) {
          setShows(moviesResponse.data.movies);
        }
      } catch (movieError) {
        console.error("Failed to fetch movies as fallback:", movieError);
      }
    }
  };

  const fetchUpcomingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/upcoming-movies");
      if (data.success) {
        const movies = (data.movies || []).map((m) => ({
          ...m,
          genre_ids: Array.isArray(m.genres) ? m.genres.map((g) => g.id) : [],
        }));
        setUpcomingMovies(movies);
      }
    } catch (error) {
      handleError("fetchUpcomingMovies", error);
    }
  };

  const fetchAllTrailers = async () => {
    if (!upcomingMovies.length) return;

    const trailersMap = { ...trailer };
    
    // Fetch trailers for each upcoming movie
    for (const movie of upcomingMovies) {
      if (!trailersMap[movie.id]) {
        try {
          const { data } = await axios.get(`/api/show/trailer/${movie.id}`);
          if (data.success) {
            trailersMap[movie.id] = { url: data.trailer_url, key: data.video_key };
          } else {
            // If no trailer found, use a fallback
            trailersMap[movie.id] = { url: "", key: null };
          }
        } catch (error) {
          console.error(`Error fetching trailer for movie ${movie.id}:`, error);
          // Use empty fallback on error
          trailersMap[movie.id] = { url: "", key: null };
        }
      }
    }
    
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
    axios,
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
