import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import {
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

const AdminMovies = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingMovie, setViewingMovie] = useState(null);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [formData, setFormData] = useState({
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
    reviews: ["", "", "", "", ""], // 5 default empty review URL fields
  });

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

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // Auto-fill reviews from Twitter search (simulated - in production, this would call Twitter API)
  const handleAutoFillReviews = async () => {
    if (!formData.title) {
      toast.error("Please enter movie title first");
      return;
    }

    setAutoFillLoading(true);

    try {
      // Note: In a real implementation, you would call a backend API that searches Twitter
      // For now, we'll show a message explaining how to manually add tweets
      toast.success(
        `To find reviews for "${formData.title}", search on Twitter/X:\n` +
          `"${formData.title} movie review" and copy tweet URLs`,
        { duration: 5000 },
      );

      // Example placeholder URLs (in production, these would come from Twitter API)
      // For demo purposes, we're not auto-filling with real URLs
      toast("Paste Twitter/X post URLs in the fields below", { icon: "ℹ️" });
    } catch (error) {
      console.error("Error auto-filling reviews:", error);
      toast.error("Failed to fetch reviews. Please add manually.");
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.overview || !formData.release_date) {
      toast.error("Please fill required fields");
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
    setEditingId(movie._id || movie.id);
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
        `/api/admin/movies/${movieId}/deactivate`,
        {},
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
        `/api/admin/movies/${movieId}/activate`,
        {},
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

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Movie" : "Add New Movie"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-2"
                >
                  Movie Title *
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Enter movie title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label
                  htmlFor="release_date"
                  className="block text-sm font-medium mb-2"
                >
                  Release Date *
                </label>
                <input
                  id="release_date"
                  type="date"
                  name="release_date"
                  value={formData.release_date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label
                  htmlFor="poster_path"
                  className="block text-sm font-medium mb-2"
                >
                  Poster URL
                </label>
                <input
                  id="poster_path"
                  type="url"
                  name="poster_path"
                  placeholder="https://example.com/poster.jpg"
                  value={formData.poster_path}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              <div>
                <label
                  htmlFor="backdrop_path"
                  className="block text-sm font-medium mb-2"
                >
                  Backdrop URL
                </label>
                <input
                  id="backdrop_path"
                  type="url"
                  name="backdrop_path"
                  placeholder="https://example.com/backdrop.jpg"
                  value={formData.backdrop_path}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
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
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
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
                  min="1"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
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
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
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
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
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
                required
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
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
                      className="block text-xs font-medium mb-1 text-gray-400"
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
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor={`cast-profile-${index}`}
                      className="block text-xs font-medium mb-1 text-gray-400"
                    >
                      Profile URL
                    </label>
                    <input
                      id={`cast-profile-${index}`}
                      type="text"
                      placeholder="https://example.com/profile.jpg"
                      value={cast.profile_path}
                      onChange={(e) =>
                        handleCastChange(index, "profile_path", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                    />
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
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                Add Cast Member
              </button>
            </div>

            {/* Reviews Section - Twitter/X Post URLs */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <label className="block text-sm font-medium">
                    Twitter/X Reviews
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillReviews}
                  disabled={autoFillLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium disabled:opacity-50"
                >
                  {autoFillLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Auto-Fill from Twitter
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Add Twitter/X post URLs containing reviews about this movie.
                These will be embedded on the movie details page.
              </p>

              {formData.reviews.map((reviewUrl, index) => (
                <div key={index} className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-500" />
                      <input
                        type="url"
                        placeholder={`https://twitter.com/user/status/123... or https://x.com/user/status/123...`}
                        value={reviewUrl}
                        onChange={(e) =>
                          handleReviewChange(index, e.target.value)
                        }
                        className={`w-full px-4 py-2 bg-gray-800 border rounded-lg focus:border-primary outline-none transition ${
                          reviewUrl && !isValidTwitterUrl(reviewUrl)
                            ? "border-red-500"
                            : "border-gray-700"
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
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Review URL
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
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
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <div
            key={movie._id || movie.id}
            className={`bg-gray-900/30 border rounded-lg p-6 hover:border-primary/50 transition ${
              movie.disabled
                ? "border-red-500/30 opacity-60"
                : "border-gray-700"
            }`}
          >
            <div className="space-y-3">
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

              <div className="space-y-2 text-sm text-gray-400">
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
          <p className="text-gray-400 text-lg">No movies found</p>
        </div>
      )}

      {/* Movie Details Modal */}
      {viewingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{viewingMovie.title}</h2>
              <button
                onClick={() => setViewingMovie(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary">Overview</h3>
                <p className="text-gray-300">{viewingMovie.overview}</p>
              </div>
              {viewingMovie.tagline && (
                <div>
                  <h3 className="font-semibold text-primary">Tagline</h3>
                  <p className="text-gray-300">"{viewingMovie.tagline}"</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-primary">Release Date</h3>
                  <p className="text-gray-300">
                    {new Date(viewingMovie.release_date).toLocaleDateString()}
                  </p>
                </div>
                {viewingMovie.runtime && (
                  <div>
                    <h3 className="font-semibold text-primary">Runtime</h3>
                    <p className="text-gray-300">
                      {viewingMovie.runtime} minutes
                    </p>
                  </div>
                )}
              </div>
              {viewingMovie.genres && viewingMovie.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary">Genres</h3>
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
                  <h3 className="font-semibold text-primary">Cast</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {viewingMovie.casts.slice(0, 6).map((cast, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <img
                          src={cast.profile_path}
                          alt={cast.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <span className="text-gray-300">{cast.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewingMovie.reviews && viewingMovie.reviews.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary flex items-center gap-2">
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
  );
};

export default AdminMovies;
