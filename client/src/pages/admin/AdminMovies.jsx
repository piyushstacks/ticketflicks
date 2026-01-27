import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Edit2, Plus, Eye, Users, Calendar, Star, Ban, X, Check } from "lucide-react";
import { dummyShowsData, dummyCastsData } from "../../assets/assets";

const AdminMovies = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingMovie, setViewingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    overview: "",
    release_date: "",
    runtime: "",
    tagline: "",
    original_language: "en",
    genres: [],
    casts: [],
  });

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/show/all-movies", {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.overview || !formData.release_date) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      let response;
      if (editingId) {
        response = await axios.put(
          `/api/admin/movies/${editingId}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post("/api/admin/movies", formData, {
          headers: getAuthHeaders(),
        });
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({
          title: "",
          overview: "",
          release_date: "",
          runtime: "",
          tagline: "",
          original_language: "en",
          genres: [],
          casts: [],
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
    setFormData({
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      runtime: movie.runtime,
      tagline: movie.tagline || "",
      original_language: movie.original_language || "en",
      genres: movie.genres || [],
      casts: movie.casts || [],
    });
    setEditingId(movie._id || movie.id);
    setShowForm(true);
  };

  const handleDisable = async (movieId) => {
    if (!window.confirm("Are you sure you want to disable this movie?")) return;

    try {
      const { data } = await axios.put(
        `/api/admin/movies/${movieId}/disable`,
        {},
        { headers: getAuthHeaders() }
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

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      overview: "",
      release_date: "",
      runtime: "",
      tagline: "",
      original_language: "en",
      genres: [],
      casts: [],
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="title"
                placeholder="Movie Title *"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="date"
                name="release_date"
                placeholder="Release Date *"
                value={formData.release_date}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="number"
                name="runtime"
                placeholder="Runtime (minutes)"
                value={formData.runtime}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <input
                type="text"
                name="tagline"
                placeholder="Tagline"
                value={formData.tagline}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
              <select
                name="original_language"
                value={formData.original_language}
                onChange={handleInputChange}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <textarea
              name="overview"
              placeholder="Movie Overview *"
              value={formData.overview}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
            />

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium mb-2">Genres</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 53, 10752, 37].map((genreId) => (
                  <label key={genreId} className="flex items-center gap-2 text-sm">
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
              <label className="block text-sm font-medium mb-2">Cast</label>
              {formData.casts.map((cast, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Cast Name"
                    value={cast.name}
                    onChange={(e) => handleCastChange(index, "name", e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                  />
                  <input
                    type="text"
                    placeholder="Profile Path URL"
                    value={cast.profile_path}
                    onChange={(e) => handleCastChange(index, "profile_path", e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeCastField(index)}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
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
              movie.disabled ? "border-red-500/30 opacity-60" : "border-gray-700"
            }`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{movie.title}</h3>
                {movie.disabled && (
                  <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded-full">
                    Disabled
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <p>{movie.overview?.substring(0, 100)}...</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{new Date(movie.release_date).toLocaleDateString()}</span>
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
                  onClick={() => handleDisable(movie._id || movie.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition text-sm font-medium"
                >
                  <Ban className="w-4 h-4" />
                  Disable
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
                  <p className="text-gray-300">{new Date(viewingMovie.release_date).toLocaleDateString()}</p>
                </div>
                {viewingMovie.runtime && (
                  <div>
                    <h3 className="font-semibold text-primary">Runtime</h3>
                    <p className="text-gray-300">{viewingMovie.runtime} minutes</p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;
