import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Edit2,
  Plus,
  Eye,
  Users,
  Calendar,
  Star,
  Ban,
  X,
  Check,
  Power,
  PowerOff,
  Twitter,
  RefreshCw,
  Trash2,
  Link,
} from "lucide-react";
import { composeValidators, dateRequired, errorId, maxLength, numberMin, optional, required, url as urlValidator } from "../../lib/validation.js";

const AdminMovies = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingMovie, setViewingMovie] = useState(null);
  const [tmdbRatingLoading, setTmdbRatingLoading] = useState(false);
  const [showTweetPicker, setShowTweetPicker] = useState(false);
  const [tweetPickerUrl, setTweetPickerUrl] = useState("");
  const [tweetPickerError, setTweetPickerError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    poster_path: "",
    backdrop_path: "",
    trailer_path: "",
    release_date: "",
    runtime: "",
    tagline: "",
    vote_average: "",
    original_language: "en",
    genres: [],
    casts: [],
    reviews: ["", "", "", "", ""], // 5 default empty review URL fields
  });

  const formId = "admin-movie";
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const validators = useMemo(
    () => ({
      title: composeValidators(required("Movie title"), maxLength("Movie title", 120)),
      // Allow any valid date (past OR future) so admins can edit historical movies
      release_date: dateRequired("Release date"),
      overview: composeValidators(required("Movie overview"), maxLength("Movie overview", 2000)),
      poster_path: optional(urlValidator("Poster URL")),
      backdrop_path: optional(urlValidator("Backdrop URL")),
      trailer_path: optional(urlValidator("Trailer URL")),
      runtime: optional(numberMin("Runtime (minutes)", 1)),
      tagline: optional(maxLength("Tagline", 140)),
    }),
    []
  );

  const validateField = (name, nextValues) => {
    const validator = validators[name];
    if (!validator) return "";
    return validator(nextValues[name], nextValues) || "";
  };

  const touchAndValidate = (name, nextValues) => {
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
    const error = validateField(name, nextValues);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
    return error;
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/movies", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setMovies(data.movies || []);
      } else {
        toast.error(data.message || "Failed to load movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to load movies");
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const { data } = await axios.get("/api/v2/languages");
      if (data.success && data.languages?.length > 0) {
        setLanguages(data.languages);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      // silently fail — dropdown will show fallback options
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchLanguages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (touched[name]) {
        touchAndValidate(name, next);
      }
      return next;
    });
  };

  const handleGenreChange = (genreId) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.some((g) => g.id === genreId)
        ? prev.genres.filter((g) => g.id !== genreId)
        : [...prev.genres, { id: genreId, name: getGenreName(genreId) }],
    }));
  };

  const getGenreName = (id) => {
    const genreMap = {
      28: "Action",
      12: "Adventure",
      16: "Animation",
      35: "Comedy",
      80: "Crime",
      99: "Documentary",
      18: "Drama",
      10751: "Family",
      14: "Fantasy",
      36: "History",
      27: "Horror",
      10402: "Music",
      9648: "Mystery",
      10749: "Romance",
      878: "Science Fiction",
      10770: "TV Movie",
      53: "Thriller",
      10752: "War",
      37: "Western",
    };
    return genreMap[id] || "Unknown";
  };

  const handleCastChange = (index, field, value) => {
    const newCasts = [...formData.casts];
    newCasts[index] = { ...newCasts[index], [field]: value };
    setFormData((prev) => ({ ...prev, casts: newCasts }));
  };

  const addCastField = () => {
    setFormData((prev) => ({
      ...prev,
      casts: [...prev.casts, { name: "", profile_path: "" }],
    }));
  };

  const removeCastField = (index) => {
    setFormData((prev) => ({
      ...prev,
      casts: prev.casts.filter((_, i) => i !== index),
    }));
  };

  // Review handling functions
  const handleReviewChange = (index, value) => {
    const newReviews = [...formData.reviews];
    newReviews[index] = value;
    setFormData((prev) => ({ ...prev, reviews: newReviews }));
  };

  const addReviewField = () => {
    setFormData((prev) => ({
      ...prev,
      reviews: [...prev.reviews, ""],
    }));
  };

  const removeReviewField = (index) => {
    setFormData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== index),
    }));
  };

  // Validate Twitter/X URL
  const isValidTwitterUrl = (url) => {
    if (!url || url.trim() === "") return true; // Empty is valid (optional)
    const twitterRegex =
      /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
    return twitterRegex.test(url);
  };

  // Fetch TMDB rating by current movie title
  const handleFetchTMDBRating = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter the movie title first");
      return;
    }
    setTmdbRatingLoading(true);
    try {
      const { data } = await axios.get(
        `/api/admin/movies/tmdb-rating?title=${encodeURIComponent(formData.title)}`
      );
      if (data.success) {
        setFormData(prev => ({ ...prev, vote_average: parseFloat(data.vote_average.toFixed(1)) }));
        toast.success(`Fetched rating: ${data.vote_average}/10 (${data.vote_count} votes) for "${data.title}"`);
      } else {
        toast.error(data.message || "Could not fetch from TMDB");
      }
    } catch (err) {
      toast.error("Failed to connect to TMDB");
    } finally {
      setTmdbRatingLoading(false);
    }
  };

  // Tweet Picker modal helpers
  const handleAddTweet = () => {
    const url = tweetPickerUrl.trim();
    const twitterRegex = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
    if (!url) {
      setTweetPickerError("Please paste a tweet URL");
      return;
    }
    if (!twitterRegex.test(url)) {
      setTweetPickerError("Invalid URL — must be a Twitter/X post URL");
      return;
    }
    if (formData.reviews.includes(url)) {
      setTweetPickerError("This tweet URL is already added");
      return;
    }
    // Replace the first empty slot, or append
    const emptyIdx = formData.reviews.findIndex(r => !r.trim());
    if (emptyIdx !== -1) {
      const next = [...formData.reviews];
      next[emptyIdx] = url;
      setFormData(prev => ({ ...prev, reviews: next }));
    } else {
      setFormData(prev => ({ ...prev, reviews: [...prev.reviews, url] }));
    }
    setTweetPickerUrl("");
    setTweetPickerError("");
    setShowTweetPicker(false);
    toast.success("Tweet added to review list!");
  };

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (!name) return;
    touchAndValidate(name, formData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextTouched = {};
    const nextErrors = {};
    for (const name of Object.keys(validators)) {
      nextTouched[name] = true;
      const error = validateField(name, formData);
      if (error) nextErrors[name] = error;
    }
    setTouched((prev) => ({ ...nextTouched, ...prev }));
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    // Validate Twitter URLs
    const invalidUrls = formData.reviews.filter(
      (url) => url && !isValidTwitterUrl(url),
    );
    if (invalidUrls.length > 0) {
      toast.error("Please enter valid Twitter/X URLs for reviews");
      return;
    }

    // Filter out empty review URLs
    const validReviews = formData.reviews.filter(
      (url) => url && url.trim() !== "",
    );

    try {
      let response;
      const submitData = {
        ...formData,
        reviews: validReviews,
      };

      if (editingId) {
        response = await axios.put(
          `/api/admin/movies/${editingId}`,
          submitData,
          { headers: getAuthHeaders() },
        );
      } else {
        response = await axios.post("/api/admin/movies/create", submitData, {
          headers: getAuthHeaders(),
        });
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({
          title: "",
          overview: "",
          poster_path: "",
          backdrop_path: "",
          trailer_path: "",
          release_date: "",
          runtime: "",
          tagline: "",
          original_language: "en",
          genres: [],
          casts: [],
          reviews: ["", "", "", "", ""],
        });
        setEditingId(null);
        setShowForm(false);
        fetchMovies();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save movie");
    }
  };

  const handleEdit = (movie) => {
    // Format release_date for HTML date input (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    // Ensure we have at least 5 review fields
    const existingReviews = movie.reviews || [];
    const reviews = [...existingReviews];
    while (reviews.length < 5) {
      reviews.push("");
    }

    setFormData({
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path || "",
      backdrop_path: movie.backdrop_path || "",
      trailer_path: movie.trailer_path || "",
      release_date: formatDateForInput(movie.release_date),
      runtime: movie.runtime,
      tagline: movie.tagline || "",
      original_language: movie.original_language || "en",
      genres: movie.genres || [],
      casts: movie.casts || [],
      reviews: reviews,
    });
    setTouched({});
    setFieldErrors({});
    setEditingId(movie._id);
    setShowForm(true);
  };

  const handleDisable = async (movieId) => {
    if (
      !window.confirm(
        "Are you sure you want to disable this movie? This will make it unavailable for all theatres.",
      )
    )
      return;

    try {
      const { data } = await axios.put(
        `/api/admin/movies/${movieId}`,
        { isActive: false },
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success("Movie disabled successfully");
        fetchMovies();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to disable movie");
    }
  };

  const handleEnable = async (movieId) => {
    if (
      !window.confirm(
        "Are you sure you want to enable this movie? This will make it available for all theatres.",
      )
    )
      return;

    try {
      const { data } = await axios.put(
        `/api/admin/movies/${movieId}`,
        { isActive: true },
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success("Movie enabled successfully");
        fetchMovies();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to enable movie");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setTouched({});
    setFieldErrors({});
    setFormData({
      title: "",
      overview: "",
      poster_path: "",
      backdrop_path: "",
      trailer_path: "",
      release_date: "",
      runtime: "",
      tagline: "",
      original_language: "en",
      genres: [],
      casts: [],
      reviews: ["", "", "", "", ""],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Movie Details Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Movie
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: "var(--overlay)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div
            className="rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 p-4 flex items-center justify-between z-10"
              style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
            >
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {editingId ? "Edit Movie" : "Add New Movie"}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 rounded-lg transition"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-2"
                >
                  Movie Title *
                </label>
                <div className="relative">
                  <input
                    id="title"
                    type="text"
                    name="title"
                    placeholder="Enter movie title"
                    value={formData.title}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.title && fieldErrors.title ? "true" : undefined}
                    aria-describedby={touched.title && fieldErrors.title ? errorId(formId, "title") : undefined}
                    required
                    className="input-field pr-10"
                  />
                  {touched.title && fieldErrors.title && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  )}
                </div>
                {touched.title && fieldErrors.title && (
                  <p id={errorId(formId, "title")} className="field-error-text mt-1" role="alert">
                    {fieldErrors.title}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="release_date"
                  className="block text-sm font-medium mb-2"
                >
                  Release Date *
                </label>
                <div className="relative">
                  <input
                    id="release_date"
                    type="date"
                    name="release_date"
                    value={formData.release_date}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.release_date && fieldErrors.release_date ? "true" : undefined}
                    aria-describedby={touched.release_date && fieldErrors.release_date ? errorId(formId, "release_date") : undefined}
                    required
                    className="input-field pr-10"
                  />
                  {touched.release_date && fieldErrors.release_date && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  )}
                </div>
                {touched.release_date && fieldErrors.release_date && (
                  <p id={errorId(formId, "release_date")} className="field-error-text mt-1" role="alert">
                    {fieldErrors.release_date}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="poster_path"
                  className="block text-sm font-medium mb-2"
                >
                  Poster URL
                </label>
                <div className="space-y-2">
                  <input
                    id="poster_path"
                    type="url"
                    name="poster_path"
                    placeholder="https://example.com/poster.jpg"
                    value={formData.poster_path}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.poster_path && fieldErrors.poster_path ? "true" : undefined}
                    aria-describedby={touched.poster_path && fieldErrors.poster_path ? errorId(formId, "poster_path") : undefined}
                    className="input-field"
                  />
                  {touched.poster_path && fieldErrors.poster_path && (
                    <p id={errorId(formId, "poster_path")} className="field-error-text" role="alert">
                      {fieldErrors.poster_path}
                    </p>
                  )}
                  {formData.poster_path && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Preview:</p>
                      <img
                        src={formData.poster_path}
                        alt="Poster preview"
                        className="w-32 h-48 object-cover rounded-lg border border-[var(--border-hover)]"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          console.error('Failed to load poster image:', formData.poster_path);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="backdrop_path"
                  className="block text-sm font-medium mb-2"
                >
                  Backdrop URL
                </label>
                <div className="space-y-2">
                  <input
                    id="backdrop_path"
                    type="url"
                    name="backdrop_path"
                    placeholder="https://example.com/backdrop.jpg"
                    value={formData.backdrop_path}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    aria-invalid={touched.backdrop_path && fieldErrors.backdrop_path ? "true" : undefined}
                    aria-describedby={touched.backdrop_path && fieldErrors.backdrop_path ? errorId(formId, "backdrop_path") : undefined}
                    className="input-field"
                  />
                  {touched.backdrop_path && fieldErrors.backdrop_path && (
                    <p id={errorId(formId, "backdrop_path")} className="field-error-text" role="alert">
                      {fieldErrors.backdrop_path}
                    </p>
                  )}
                  {formData.backdrop_path && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Preview:</p>
                      <img
                        src={formData.backdrop_path}
                        alt="Backdrop preview"
                        className="w-full h-32 object-cover rounded-lg border border-[var(--border-hover)]"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          console.error('Failed to load backdrop image:', formData.backdrop_path);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="trailer_path"
                  className="block text-sm font-medium mb-2"
                >
                  Trailer URL
                </label>
                <input
                  id="trailer_path"
                  type="url"
                  name="trailer_path"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.trailer_path}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.trailer_path && fieldErrors.trailer_path ? "true" : undefined}
                  aria-describedby={touched.trailer_path && fieldErrors.trailer_path ? errorId(formId, "trailer_path") : undefined}
                  className="input-field"
                />
                {touched.trailer_path && fieldErrors.trailer_path && (
                  <p id={errorId(formId, "trailer_path")} className="field-error-text mt-1" role="alert">
                    {fieldErrors.trailer_path}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="runtime"
                  className="block text-sm font-medium mb-2"
                >
                  Runtime (minutes)
                </label>
                <input
                  id="runtime"
                  type="number"
                  name="runtime"
                  placeholder="120"
                  value={formData.runtime}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.runtime && fieldErrors.runtime ? "true" : undefined}
                  aria-describedby={touched.runtime && fieldErrors.runtime ? errorId(formId, "runtime") : undefined}
                  min="1"
                  className="input-field"
                />
                {touched.runtime && fieldErrors.runtime && (
                  <p id={errorId(formId, "runtime")} className="field-error-text mt-1" role="alert">
                    {fieldErrors.runtime}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="vote_average"
                  className="block text-sm font-medium mb-2"
                >
                  TMDB Rating (0–10)
                </label>
                <div className="flex gap-2">
                  <input
                    id="vote_average"
                    type="number"
                    name="vote_average"
                    placeholder="e.g. 7.8"
                    value={formData.vote_average}
                    onChange={handleInputChange}
                    min="0"
                    max="10"
                    step="0.1"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleFetchTMDBRating}
                    disabled={tmdbRatingLoading}
                    title="Fetch rating from TMDB using the title above"
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {tmdbRatingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                    Fetch from TMDB
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">Enter the movie title above, then click Fetch to auto-fill from TMDB.</p>
              </div>
              <div>
                <label
                  htmlFor="tagline"
                  className="block text-sm font-medium mb-2"
                >
                  Tagline
                </label>
                <input
                  id="tagline"
                  type="text"
                  name="tagline"
                  placeholder="Enter movie tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  aria-invalid={touched.tagline && fieldErrors.tagline ? "true" : undefined}
                  aria-describedby={touched.tagline && fieldErrors.tagline ? errorId(formId, "tagline") : undefined}
                  className="input-field"
                />
                {touched.tagline && fieldErrors.tagline && (
                  <p id={errorId(formId, "tagline")} className="field-error-text mt-1" role="alert">
                    {fieldErrors.tagline}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="original_language"
                  className="block text-sm font-medium mb-2"
                >
                  Original Language
                </label>
                <select
                  id="original_language"
                  name="original_language"
                  value={formData.original_language}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {languages.length > 0 ? (
                    languages.map((lang) => (
                      <option key={lang._id} value={lang.code}>
                        {lang.name}
                      </option>
                    ))
                  ) : (
                    /* Fallback while loading */
                    <>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="ta">Tamil</option>
                      <option value="te">Telugu</option>
                      <option value="ml">Malayalam</option>
                      <option value="kn">Kannada</option>
                      <option value="mr">Marathi</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="overview"
                className="block text-sm font-medium mb-2"
              >
                Movie Overview *
              </label>
              <textarea
                id="overview"
                name="overview"
                placeholder="Enter movie overview/synopsis"
                value={formData.overview}
                onChange={handleInputChange}
                onBlur={handleBlur}
                aria-invalid={touched.overview && fieldErrors.overview ? "true" : undefined}
                aria-describedby={touched.overview && fieldErrors.overview ? errorId(formId, "overview") : undefined}
                required
                rows={4}
                className="input-field"
              />
              {touched.overview && fieldErrors.overview && (
                <p id={errorId(formId, "overview")} className="field-error-text mt-1" role="alert">
                  {fieldErrors.overview}
                </p>
              )}
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium mb-2">Genres</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648,
                  10749, 878, 53, 10752, 37,
                ].map((genreId) => (
                  <label
                    key={genreId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.genres.some((g) => g.id === genreId)}
                      onChange={() => handleGenreChange(genreId)}
                      className="rounded"
                    />
                    {getGenreName(genreId)}
                  </label>
                ))}
              </div>
            </div>

            {/* Cast */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Cast Members
              </label>
              {formData.casts.map((cast, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`cast-name-${index}`}
                      className="block text-xs font-medium mb-1 text-[var(--text-muted)]"
                    >
                      Cast Name
                    </label>
                    <input
                      id={`cast-name-${index}`}
                      type="text"
                      placeholder="Enter cast member name"
                      value={cast.name}
                      onChange={(e) =>
                        handleCastChange(index, "name", e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor={`cast-profile-${index}`}
                      className="block text-xs font-medium mb-1 text-[var(--text-muted)]"
                    >
                      Profile URL
                    </label>
                    <div className="space-y-2">
                      <input
                        id={`cast-profile-${index}`}
                        type="url"
                        placeholder="https://example.com/profile.jpg"
                        value={cast.profile_path}
                        onChange={(e) =>
                          handleCastChange(index, "profile_path", e.target.value)
                        }
                        className="input-field"
                      />
                      {cast.profile_path && (
                        <div className="flex items-center gap-2">
                          <img
                            src={cast.profile_path}
                            alt={`${cast.name} profile`}
                            className="w-12 h-12 rounded-full object-cover border border-[var(--border-hover)]"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-[var(--text-muted)]">Profile preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCastField(index)}
                    className="mt-6 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                    title="Remove cast member"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCastField}
                className="btn-secondary text-sm"
              >
                Add Cast Member
              </button>
            </div>

            {/* Reviews Section - Twitter/X Post URLs */}
            <div className="border-t border-[var(--border)] pt-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center gap-2">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <label className="block text-sm font-medium">
                    Twitter/X Reviews
                  </label>
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Add Twitter/X post URLs containing reviews about this movie.
                These will be embedded on the movie details page.
              </p>

              {formData.reviews.map((reviewUrl, index) => (
                <div key={index} className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="url"
                        placeholder={`https://twitter.com/user/status/123... or https://x.com/user/status/123...`}
                        value={reviewUrl}
                        onChange={(e) =>
                          handleReviewChange(index, e.target.value)
                        }
                        className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border rounded-lg focus:border-primary outline-none transition ${
                          reviewUrl && !isValidTwitterUrl(reviewUrl)
                            ? "border-red-500"
                            : "border-[var(--border)]"
                        }`}
                      />
                    </div>
                    {reviewUrl && !isValidTwitterUrl(reviewUrl) && (
                      <p className="text-xs text-red-400 mt-1 ml-6">
                        Please enter a valid Twitter/X post URL
                      </p>
                    )}
                  </div>
                  {formData.reviews.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReviewField(index)}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                      title="Remove review URL"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addReviewField}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Review URL
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
              >
                {editingId ? "Update Movie" : "Add Movie"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <div
            key={movie._id || movie.id}
            className={`bg-[var(--bg-primary)]/30 border rounded-lg p-6 hover:border-primary/50 transition ${
              movie.disabled
                ? "border-red-500/30 opacity-60"
                : "border-[var(--border)]"
            }`}
          >
            <div className="space-y-3">
              {/* Movie Poster */}
              {movie.poster_path && (
                <div className="w-32 h-48 overflow-hidden rounded-lg">
                  <img
                    src={movie.poster_path}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{movie.title}</h3>
                <div className="flex items-center gap-2">
                  {movie.reviews && movie.reviews.length > 0 && (
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                      <Twitter className="w-3 h-3" />
                      {movie.reviews.length}
                    </span>
                  )}
                  {movie.disabled && (
                    <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-[var(--text-muted)]">
                <p>{movie.overview?.substring(0, 100)}...</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {new Date(movie.release_date).toLocaleDateString()}
                  </span>
                </div>
                {movie.runtime && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{movie.runtime} min</span>
                  </div>
                )}
                {movie.vote_average && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.genres.slice(0, 3).map((genre) => (
                      <span
                        key={genre.id}
                        className="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setViewingMovie(movie)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => handleEdit(movie)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() =>
                    movie.disabled
                      ? handleEnable(movie._id || movie.id)
                      : handleDisable(movie._id || movie.id)
                  }
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                    movie.disabled
                      ? "bg-green-600/20 hover:bg-green-600/30 text-green-400"
                      : "bg-orange-600/20 hover:bg-orange-600/30 text-orange-400"
                  }`}
                >
                  {movie.disabled ? (
                    <>
                      <Power className="w-4 h-4" />
                      Enable
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-4 h-4" />
                      Disable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {movies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)] text-lg">No movies found</p>
        </div>
      )}

      {/* Movie Details Modal */}
      {viewingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{viewingMovie.title}</h2>
              <button
                onClick={() => setViewingMovie(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Movie Poster */}
              {viewingMovie.poster_path && (
                <div className="flex justify-center">
                  <img
                    src={viewingMovie.poster_path}
                    alt={viewingMovie.title}
                    className="w-48 h-72 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-[var(--color-accent)]">Overview</h3>
                <p className="text-[var(--text-secondary)]">{viewingMovie.overview}</p>
              </div>
              {viewingMovie.tagline && (
                <div>
                  <h3 className="font-semibold text-[var(--color-accent)]">Tagline</h3>
                  <p className="text-[var(--text-secondary)]">"{viewingMovie.tagline}"</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-[var(--color-accent)]">Release Date</h3>
                  <p className="text-[var(--text-secondary)]">
                    {new Date(viewingMovie.release_date).toLocaleDateString()}
                  </p>
                </div>
                {viewingMovie.runtime && (
                  <div>
                    <h3 className="font-semibold text-[var(--color-accent)]">Runtime</h3>
                    <p className="text-[var(--text-secondary)]">
                      {viewingMovie.runtime} minutes
                    </p>
                  </div>
                )}
              </div>
              {viewingMovie.genres && viewingMovie.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--color-accent)]">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingMovie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewingMovie.casts && viewingMovie.casts.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--color-accent)]">Cast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {viewingMovie.casts.slice(0, 6).map((cast, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {cast.profile_path ? (
                          <img
                            src={cast.profile_path}
                            alt={cast.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                            <span className="text-[var(--text-muted)] text-xs">{cast.name?.charAt(0) || '?'}</span>
                          </div>
                        )}
                        <span className="text-[var(--text-secondary)]">{cast.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingMovie.reviews && viewingMovie.reviews.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[var(--color-accent)] flex items-center gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter/X Reviews ({viewingMovie.reviews.length})
                  </h3>
                  <div className="mt-2 space-y-2">
                    {viewingMovie.reviews.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm truncate"
                      >
                        <Link className="w-3 h-3 flex-shrink-0" />
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Tweet Picker Modal */}
      {showTweetPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Twitter className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-base">Add a Tweet Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTweetPicker(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Paste a Twitter or X post URL below. It will be embedded on the movie's detail page as a review.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">Tweet URL</label>
                <input
                  type="url"
                  autoFocus
                  placeholder="https://x.com/user/status/123456789"
                  value={tweetPickerUrl}
                  onChange={e => { setTweetPickerUrl(e.target.value); setTweetPickerError(""); }}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTweet())}
                  className={`input-field w-full ${
                    tweetPickerError ? "border-red-500" : ""
                  }`}
                />
                {tweetPickerError && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {tweetPickerError}
                  </p>
                )}
              </div>

              {tweetPickerUrl && !tweetPickerError && (
                <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)] break-all">
                  <span className="text-[var(--text-muted)] mr-1">Preview URL:</span>
                  <span className="text-blue-400">{tweetPickerUrl}</span>
                </div>
              )}

              <p className="text-xs text-[var(--text-muted)]">
                Valid formats:{" "}
                <code className="bg-[var(--bg-secondary)] px-1 rounded">https://twitter.com/user/status/ID</code>{" "}
                or{" "}
                <code className="bg-[var(--bg-secondary)] px-1 rounded">https://x.com/user/status/ID</code>
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowTweetPicker(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTweet}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
              >
                <Check className="w-4 h-4" />
                Add Tweet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMovies;
