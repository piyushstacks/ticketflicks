import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
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
      const { data } = await axios.get("/api/show/all");
      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message || "Failed to load shows");
      }
    } catch (error) {
      handleError("fetchShows", error);
    }
  };

  const fetchUpcomingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/upcoming-movies");
      if (data.success) {
        setUpcomingMovies(data.movies);
      } else {
        toast.error(data.message || "Failed to load upcoming movies");
      }
    } catch (error) {
      handleError("fetchUpcomingMovies", error);
    }
  };

  const fetchAllTrailers = async () => {
    if (!upcomingMovies.length) return;

    const trailersMap = { ...trailer }; // Don't overwrite existing trailers

    const newMovies = upcomingMovies.filter((movie) => !trailersMap[movie.id]);

    if (!newMovies.length) return; // No new trailers to fetch

    // Process in batches of 3 to avoid overwhelming the server/TMDB
    const BATCH_SIZE = 3;
    for (let i = 0; i < newMovies.length; i += BATCH_SIZE) {
      const batch = newMovies.slice(i, i + BATCH_SIZE);
      const trailerRequests = batch.map((movie) =>
        axios.get(`/api/show/trailer/${movie.id}`)
      );

      const responses = await Promise.allSettled(trailerRequests);

      responses.forEach((res, index) => {
        if (res.status === "fulfilled" && res.value.data.success) {
          const movieId = batch[index].id;
          trailersMap[movieId] = {
            url: res.value.data.trailer_url,
            key: res.value.data.video_key,
          };
        }
      });

      // Update state incrementally
      setTrailer((prev) => ({ ...prev, ...trailersMap }));

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < newMovies.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
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
