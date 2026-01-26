import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Calendar, Clock, Film } from "lucide-react";
import Loading from "../../components/Loading";

const ManagerShows = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    movieId: "",
    screenId: "",
    showDateTime: "",
  });

  const fetchShows = async () => {
    try {
      // This would need a new API endpoint to get manager's shows
      // For now, we'll fetch all shows
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setShows(data.shows || []);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  };

  const fetchMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/all-movies");
      if (data.success) {
        setMovies(data.movies || []);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const fetchScreens = async () => {
    try {
      // This needs a new API endpoint
      const { data } = await axios.get("/api/show/screens", {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        setScreens(data.screens || []);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
    fetchMovies();
    fetchScreens();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.movieId || !formData.screenId || !formData.showDateTime) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      let response;
      if (editingId) {
        response = await axios.put(
          `/api/manager/shows/${editingId}`,
          formData,
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post("/api/manager/shows/add", formData, {
          headers: getAuthHeaders(),
        });
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({ movieId: "", screenId: "", showDateTime: "" });
        setEditingId(null);
        setShowForm(false);
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save show");
    }
  };

  const handleDelete = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;

    try {
      const { data } = await axios.delete(`/api/manager/shows/${showId}`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        toast.success("Show deleted successfully");
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete show");
    }
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
        <h1 className="text-3xl font-bold">Manage Shows</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Show
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Show" : "Add New Show"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                name="movieId"
                value={formData.movieId}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              >
                <option value="">Select Movie</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>

              <select
                name="screenId"
                value={formData.screenId}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              >
                <option value="">Select Screen</option>
                {screens.map((screen) => (
                  <option key={screen._id} value={screen._id}>
                    Screen {screen.screenNumber}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                name="showDateTime"
                value={formData.showDateTime}
                onChange={handleInputChange}
                required
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ movieId: "", screenId: "", showDateTime: "" });
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
              >
                {editingId ? "Update Show" : "Add Show"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shows Table */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Movie
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Screen
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {shows.length > 0 ? (
                shows.map((show) => (
                  <tr key={show._id} className="hover:bg-gray-800/30 transition">
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" />
                      <span>{show.movie?.title || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      Screen {show.screen?.screenNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(show.showDateTime).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              movieId: show.movie._id,
                              screenId: show.screen._id,
                              showDateTime: new Date(show.showDateTime)
                                .toISOString()
                                .slice(0, 16),
                            });
                            setEditingId(show._id);
                            setShowForm(true);
                          }}
                          className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(show._id)}
                          className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <p className="text-gray-400">No shows found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerShows;
