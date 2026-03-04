import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthContext } from "./AuthContext.jsx";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000";

// Single axios instance with a sensible timeout so the app never hangs
const api = axios.create({
  baseURL,
  timeout: 10000, // 10-second timeout per request
});
// Keep default axios pointing to the same place (for legacy usage in child components)
axios.defaults.baseURL = baseURL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const imageBaseURL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const { user, getAuthHeaders, token } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  // ─── Error handler ────────────────────────────────────────────────────────
  const handleError = (prefix, error, userMessage) => {
    if (userMessage) {
      toast.error(userMessage);
      return;
    }
    if (!error?.response) {
      toast.error("Unable to reach server. Please check your connection.");
      return;
    }
    const msg = error.response?.data?.message;
    if (msg) toast.error(msg);
  };

  // ─── Admin check ──────────────────────────────────────────────────────────
  const fetchIsAdmin = async () => {
    try {
      const { data } = await api.get("/api/user/is-admin", {
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

  // ─── Movies ───────────────────────────────────────────────────────────────
  // Single fetch: gets shows-with-showtimes AND all active movies in one parallel call.
  // Result is merged and de-duped. Replaces the old broken 3-tier waterfall + separate fetchUpcomingMovies.
  const fetchShows = async () => {
    try {
      const [showsRes, allMoviesRes] = await Promise.allSettled([
        api.get("/api/show/shows/all"),
        api.get("/api/show/upcoming-movies"),
      ]);

      const moviesWithShows =
        showsRes.status === "fulfilled" &&
        showsRes.value.data.success &&
        Array.isArray(showsRes.value.data.shows)
          ? showsRes.value.data.shows
          : [];

      const allMovies =
        allMoviesRes.status === "fulfilled" &&
        allMoviesRes.value.data.success &&
        Array.isArray(allMoviesRes.value.data.movies)
          ? allMoviesRes.value.data.movies
          : [];

      // Merge: bookable movies first, rest of catalogue after
      const showIds = new Set(moviesWithShows.map((m) => (m._id || m.id)?.toString()));
      const merged = [
        ...moviesWithShows.map((m) => ({ ...m, hasShows: true })),
        ...allMovies
          .filter((m) => !showIds.has((m._id || m.id)?.toString()))
          .map((m) => ({ ...m, hasShows: false })),
      ];

      setShows(merged);
      // Also keep upcomingMovies in sync (no second API call needed)
      setUpcomingMovies(allMovies);
    } catch (error) {
      handleError("fetchShows", error);
    }
  };

  // Kept for backward-compat (pages that call fetchUpcomingMovies directly)
  const fetchUpcomingMovies = async () => {
    try {
      const { data } = await api.get("/api/show/upcoming-movies");
      if (data.success) {
        setUpcomingMovies(data.movies || []);
      }
    } catch (error) {
      handleError("fetchUpcomingMovies", error);
    }
  };

  // ─── Favourites ───────────────────────────────────────────────────────────
  const fetchFavoriteMovies = async () => {
    try {
      const { data } = await api.get("/api/user/favorites", {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        setFavoriteMovies(data.movies);
      }
    } catch (error) {
      handleError("fetchFavoriteMovies", error);
    }
  };

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await fetchShows(); // one call, covers both shows + upcoming
      } catch (error) {
        handleError("InitialLoad", error, "Error loading movies.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // User-specific data after login
  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  // ─── Context value ────────────────────────────────────────────────────────
  const value = {
    axios: api,
    fetchIsAdmin,
    user,
    getAuthHeaders,
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
    // trailer kept for legacy compat — now just empty object (trailers loaded in MovieDetails directly)
    trailer: {},
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
