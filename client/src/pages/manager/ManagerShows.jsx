import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { 
  Plus, Edit2, Trash2, Power, PowerOff, Eye, Calendar, Clock, Film, 
  Monitor, Copy, Filter, ChevronDown, X, Repeat
} from "lucide-react";
import Loading from "../../components/Loading";

const ManagerShows = () => {
  const { axios, getAuthHeaders, imageBaseURL } = useAppContext();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingShow, setViewingShow] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [filterWeek, setFilterWeek] = useState('current');
  const [filterMovie, setFilterMovie] = useState('');
  const [filterScreen, setFilterScreen] = useState('');
  
  const [formData, setFormData] = useState({
    movie: "",
    screen: "",
    showTime: "",
    language: "English",
    startDate: "",
    endDate: "",
    isActive: true
  });

  const languages = [
    "English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", 
    "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu", "Others"
  ];

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(today.setDate(diff + 6));
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  const getNextWeekDates = () => {
    const currentWeek = getCurrentWeekDates();
    const nextMonday = new Date(currentWeek.start);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const nextSunday = new Date(currentWeek.end);
    nextSunday.setDate(nextSunday.getDate() + 7);
    
    return {
      start: nextMonday.toISOString().split('T')[0],
      end: nextSunday.toISOString().split('T')[0]
    };
  };

  const fetchShows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/manager/shows", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setShows(data.shows || []);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
      toast.error("Failed to fetch shows");
    } finally {
      setLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const { data } = await axios.get("/api/manager/movies/available", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setMovies(data.movies || []);
      } else {
        console.error("Movies API error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to fetch movies");
    }
  };

  const fetchScreens = async () => {
    try {
      const { data } = await axios.get("/api/manager/screens", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setScreens(data.screens || []);
      } else {
        console.error("Screens API error:", data.message);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      toast.error("Failed to fetch screens");
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

    if (!formData.movie || !formData.screen || !formData.showTime) {
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
        // Set default dates for new shows (current week)
        const weekDates = getCurrentWeekDates();
        const showData = {
          ...formData,
          startDate: formData.startDate || weekDates.start,
          endDate: formData.endDate || weekDates.end
        };
        
        response = await axios.post(
          "/api/manager/shows/add",
          showData,
          { headers: getAuthHeaders() }
        );
      }

      const { data } = response;
      if (data.success) {
        toast.success(data.message);
        setFormData({
          movie: "",
          screen: "",
          showTime: "",
          language: "English",
          startDate: "",
          endDate: "",
          isActive: true
        });
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

  const handleEdit = (show) => {
    setFormData({
      movie: show.movie._id,
      screen: show.screen._id,
      showTime: show.showTime,
      language: show.language || "English",
      startDate: show.startDate,
      endDate: show.endDate,
      isActive: show.isActive
    });
    setEditingId(show._id);
    setShowForm(true);
  };

  const handleToggleStatus = async (showId, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable';
    const confirmMessage = `Are you sure you want to ${action} this show?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const { data } = await axios.patch(`/api/manager/shows/${showId}/toggle`, {
        isActive: !currentStatus
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Show ${action}d successfully`);
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to ${action} show`);
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

  const handleRepeatForNextWeek = async () => {
    const confirmMessage = "Are you sure you want to repeat all current shows for next week?";
    if (!window.confirm(confirmMessage)) return;

    try {
      const currentWeek = getCurrentWeekDates();
      const nextWeek = getNextWeekDates();
      
      const { data } = await axios.post("/api/manager/shows/repeat-week", {
        currentWeekStart: currentWeek.start,
        currentWeekEnd: currentWeek.end,
        nextWeekStart: nextWeek.start,
        nextWeekEnd: nextWeek.end
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Successfully repeated ${data.count} shows for next week`);
        fetchShows();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to repeat shows for next week");
    }
  };

  const getFilteredShows = () => {
    let filtered = [...shows];
    
    // Filter by week
    const currentWeek = getCurrentWeekDates();
    const nextWeek = getNextWeekDates();
    
    if (filterWeek === 'current') {
      filtered = filtered.filter(show => {
        const showDate = new Date(show.startDate);
        return showDate >= new Date(currentWeek.start) && showDate <= new Date(currentWeek.end);
      });
    } else if (filterWeek === 'next') {
      filtered = filtered.filter(show => {
        const showDate = new Date(show.startDate);
        return showDate >= new Date(nextWeek.start) && showDate <= new Date(nextWeek.end);
      });
    }
    
    // Filter by movie
    if (filterMovie) {
      filtered = filtered.filter(show => show.movie._id === filterMovie);
    }
    
    // Filter by screen
    if (filterScreen) {
      filtered = filtered.filter(show => show.screen._id === filterScreen);
    }
    
    return filtered;
  };

  const formatShowTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return <Loading />;
  }

  const filteredShows = getFilteredShows();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Shows</h1>
          <p className="text-gray-400 mt-1">Create and manage movie show schedules</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRepeatForNextWeek}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition font-medium"
          >
            <Repeat className="w-5 h-5" />
            Repeat for Next Week
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Show
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Week</label>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-primary outline-none transition"
            >
              <option value="current">Current Week</option>
              <option value="next">Next Week</option>
              <option value="all">All Shows</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Movie</label>
            <select
              value={filterMovie}
              onChange={(e) => setFilterMovie(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-primary outline-none transition"
            >
              <option value="">All Movies</option>
              {movies.map((movie) => (
                <option key={movie._id} value={movie._id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Screen</label>
            <select
              value={filterScreen}
              onChange={(e) => setFilterScreen(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-primary outline-none transition"
            >
              <option value="">All Screens</option>
              {screens.map((screen) => (
                <option key={screen._id} value={screen._id}>
                  {screen.name || `Screen ${screen.screenNumber}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              <span className="font-semibold">{filteredShows.length}</span> shows found
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Show Form */}
      {showForm && (
        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Show" : "Add New Show"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Movie *</label>
                <select
                  name="movie"
                  value={formData.movie}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                >
                  <option value="">Select a movie...</option>
                  {movies && movies.filter(movie => movie.isActive).map((movie) => (
                    <option key={movie._id} value={movie._id}>
                      {movie.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Screen *</label>
                <select
                  name="screen"
                  value={formData.screen}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                >
                  <option value="">Select a screen...</option>
                  {screens && screens.filter(screen => screen.status !== 'disabled').map((screen) => (
                    <option key={screen._id} value={screen._id}>
                      {screen.name || `Screen ${screen.screenNumber}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Show Time *</label>
                <input
                  type="time"
                  name="showTime"
                  value={formData.showTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Language *</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm text-gray-300">
                Active (available for booking)
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    movie: "",
                    screen: "",
                    showTime: "",
                    language: "English",
                    startDate: "",
                    endDate: "",
                    isActive: true
                  });
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

      {/* Shows List */}
      <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Show Schedule</h2>
          <p className="text-gray-400 text-sm mt-1">
            {filterWeek === 'current' ? 'Current week shows' : filterWeek === 'next' ? 'Next week shows' : 'All shows'}
          </p>
        </div>

        {filteredShows.length > 0 ? (
          <div className="space-y-4">
            {filteredShows.map((show) => (
              <div
                key={show._id}
                className={`bg-gray-800/50 border rounded-lg p-4 hover:border-primary/50 transition ${
                  !show.isActive ? 'border-gray-700 opacity-60' : 'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Movie Poster */}
                    <div className="w-16 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {show.movie.poster_path ? (
                        <img
                          src={
                            show.movie.poster_path.startsWith("http")
                              ? show.movie.poster_path
                              : `${imageBaseURL}${show.movie.poster_path}`
                          }
                          alt={show.movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Show Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{show.movie.title}</h3>
                        {!show.isActive && (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-4 h-4" />
                          <span>{show.screen.name || `Screen ${show.screen.screenNumber}`}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatShowTime(show.showTime)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(show.startDate).toLocaleDateString()} - {new Date(show.endDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                            {show.language || "English"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingShow(show)}
                      className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleEdit(show)}
                      className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition"
                      title="Edit Show"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(show._id, show.isActive)}
                      className={`p-2 rounded-lg transition ${
                        show.isActive
                          ? 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400'
                          : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                      }`}
                      title={show.isActive ? "Disable Show" : "Enable Show"}
                    >
                      {show.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(show._id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                      title="Delete Show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Shows Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {filterWeek === 'current' 
                ? "No shows scheduled for this week. Create your first show to get started."
                : "No shows found for the selected filters."}
            </p>
          </div>
        )}
      </div>

      {/* Show Details Modal */}
      {viewingShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingShow.movie.title}</h2>
                  <p className="text-gray-400 mt-1">Show Details</p>
                </div>
                <button
                  onClick={() => setViewingShow(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {viewingShow.movie.poster_path ? (
                    <img
                      src={
                        viewingShow.movie.poster_path.startsWith("http")
                          ? viewingShow.movie.poster_path
                          : `${imageBaseURL}${viewingShow.movie.poster_path}`
                      }
                      alt={viewingShow.movie.title}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-800 flex items-center justify-center rounded-lg">
                      <Film className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Show Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Screen:</span>
                        <span className="text-gray-300">{viewingShow.screen.name || `Screen ${viewingShow.screen.screenNumber}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Show Time:</span>
                        <span className="text-gray-300">{formatShowTime(viewingShow.showTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Language:</span>
                        <span className="text-gray-300">{viewingShow.language || "English"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Start Date:</span>
                        <span className="text-gray-300">{new Date(viewingShow.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">End Date:</span>
                        <span className="text-gray-300">{new Date(viewingShow.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          viewingShow.isActive 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {viewingShow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {viewingShow.movie.overview && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-primary mb-3">Movie Overview</h3>
                      <p className="text-gray-300 text-sm">{viewingShow.movie.overview}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerShows;
