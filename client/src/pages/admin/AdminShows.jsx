import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Eye, Monitor, Calendar, Clock, Users, MapPin, Film, Trash2, Power, AlertCircle } from "lucide-react";

const AdminShows = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState("");
  const [viewingShow, setViewingShow] = useState(null);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setShows(data.shows || []);
      } else {
        toast.error(data.message || "Failed to load shows");
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
      toast.error("Failed to load shows");
    } finally {
      setLoading(false);
    }
  };

  const fetchTheatres = async () => {
    try {
      const { data } = await axios.get("/api/admin/theatres", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        // Use 'all' array if present, otherwise combine theatres + disabledTheatres
        setTheatres(data.all || [...(data.theatres || []), ...(data.disabledTheatres || [])]);
      }
    } catch (error) {
      console.error("Error fetching theatres:", error);
    }
  };

  useEffect(() => {
    fetchShows();
    fetchTheatres();
  }, []);

  const handleToggleStatus = async (showId) => {
    try {
      const { data } = await axios.patch(`/api/show/shows/${showId}/status`, {}, {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        toast.success(data.message);
        setShows(shows.map(s => s._id === showId ? { ...s, isActive: !s.isActive } : s));
        if (viewingShow?._id === showId) {
          setViewingShow({ ...viewingShow, isActive: !viewingShow.isActive });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update show status");
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show? This action cannot be undone.")) return;
    
    try {
      const { data } = await axios.delete(`/api/show/shows/${showId}`, {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        toast.success(data.message);
        setShows(shows.filter(s => s._id !== showId));
        if (viewingShow?._id === showId) setViewingShow(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete show");
    }
  };

  const filteredShows = selectedTheatre
    ? shows.filter((show) => show.theatre?._id === selectedTheatre)
    : shows;

  // Group shows by theatre
  const showsByTheatre = filteredShows.reduce((acc, show) => {
    const theatreId = show.theatre?._id;
    if (!acc[theatreId]) {
      acc[theatreId] = {
        theatre: show.theatre,
        shows: []
      };
    }
    acc[theatreId].shows.push(show);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gray-900/40 p-8 rounded-3xl border border-gray-800 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <Calendar className="w-10 h-10 text-primary" />
            Live Show Management
          </h1>
          <p className="text-gray-400 mt-2 font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Monitoring all active movie shows across all registered theatres
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <MapPin className="w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            </div>
            <select
              value={selectedTheatre}
              onChange={(e) => setSelectedTheatre(e.target.value)}
              className="w-full pl-11 pr-10 py-4 bg-gray-800/50 border border-gray-700 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer font-bold text-sm"
            >
              <option value="">🏢 All Registered Theatres</option>
              {theatres.map((theatre) => (
                <option key={theatre._id} value={theatre._id}>
                  {theatre.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <div className="w-5 h-5 bg-gray-700 rounded-lg flex items-center justify-center">
                <Monitor className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-6 py-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold text-primary uppercase tracking-widest">
              {shows.length} Total Shows
            </span>
          </div>
        </div>
      </div>

      {/* Shows Organized by Theatre */}
      <div className="space-y-12">
        {Object.keys(showsByTheatre).length > 0 ? (
          Object.values(showsByTheatre).map(({ theatre, shows: theatreShows }) => (
            <div key={theatre._id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Theatre Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{theatre.name}</h2>
                    <p className="text-gray-500 text-sm font-medium">
                      {theatre.city} • {theatre.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-xl">
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-300">
                    {theatreShows.length} Scheduled {theatreShows.length === 1 ? 'Show' : 'Shows'}
                  </span>
                </div>
              </div>

              {/* Shows Grid for this Theatre */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {theatreShows.map((show) => (
                  <div
                    key={show._id}
                    className="group bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5"
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      {/* Movie Poster */}
                      <div className="w-full sm:w-48 h-64 sm:h-auto relative overflow-hidden">
                        <img
                          src={
                            show.movie?.poster_path 
                              ? (show.movie.poster_path.startsWith("http") 
                                ? show.movie.poster_path 
                                : `https://image.tmdb.org/t/p/w500${show.movie.poster_path}`)
                              : "/placeholder-movie.jpg"
                          }
                          alt={show.movie?.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-gray-900 via-transparent to-transparent opacity-60" />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10">
                            {show.language || "English"}
                          </span>
                        </div>
                      </div>

                      {/* Show Details */}
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                              {show.movie?.title || "Unknown Movie"}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <Monitor className="w-3.5 h-3.5 text-primary" />
                                {show.screen?.name || `Screen ${show.screen?.screenNumber}`}
                              </span>
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${show.isActive ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-red-500'}`} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Show Date</p>
                            <p className="text-sm font-black text-gray-200">
                              {show.showDateTime ? new Date(show.showDateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-gray-800/40 p-3 rounded-2xl border border-gray-700/50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Start Time</p>
                            <p className="text-sm font-black text-gray-200">{show.showTime || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-2">
                          <div className="flex -space-x-2">
                            {show.movie?.genres?.slice(0, 2).map((genre, idx) => (
                              <span 
                                key={idx}
                                className="px-3 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-full border border-gray-700"
                              >
                                {genre.name || genre}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingShow(show)}
                              title="View Show Details"
                              className="flex items-center justify-center w-9 h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all border border-primary/20 hover:border-primary active:scale-95"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleStatus(show._id)}
                              title={show.isActive ? "Deactivate Show" : "Activate Show"}
                              className={`flex items-center justify-center w-9 h-9 ${
                                show.isActive 
                                  ? "bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border-amber-500/20 hover:border-amber-500" 
                                  : "bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-green-500/20 hover:border-green-500"
                              } rounded-xl transition-all border active:scale-95`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteShow(show._id)}
                              title="Delete Show"
                              className="flex items-center justify-center w-9 h-9 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 hover:border-red-500 active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-700">
              <Film className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">No active shows found</h3>
            <p className="text-gray-500 font-medium max-w-xs">
              There are no movie shows scheduled for the selected theatre or criteria.
            </p>
          </div>
        )}
      </div>

      {/* Show Details Modal */}
      {viewingShow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Film className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Show Details</h2>
                  <p className="text-gray-500 text-sm font-medium">Detailed insights for this screening</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleStatus(viewingShow._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    viewingShow.isActive 
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white" 
                      : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {viewingShow.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDeleteShow(viewingShow._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setViewingShow(null)}
                  className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Movie Details Column */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="relative group rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                    <img
                      src={
                        viewingShow.movie?.poster_path
                          ? (viewingShow.movie.poster_path.startsWith("http")
                            ? viewingShow.movie.poster_path
                            : `https://image.tmdb.org/t/p/w500${viewingShow.movie.poster_path}`)
                          : "/placeholder-movie.jpg"
                      }
                      alt={viewingShow.movie?.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-black text-white mb-2">{viewingShow.movie?.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingShow.movie?.genres?.map((genre, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10">
                            {genre.name || genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-800/50">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      Synopsis
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">
                      {viewingShow.movie?.overview || "No overview available for this movie."}
                    </p>
                  </div>
                </div>

                {/* Show & Statistics Column */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Show Info Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 p-5 rounded-3xl border border-gray-800/50">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        Theatre & Screen
                      </p>
                      <p className="text-lg font-black text-white leading-tight">{viewingShow.theatre?.name}</p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {viewingShow.screen?.name || `Screen ${viewingShow.screen?.screenNumber}`}
                      </p>
                    </div>
                    <div className="bg-gray-800/30 p-5 rounded-3xl border border-gray-800/50">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary" />
                        Schedule
                      </p>
                      <p className="text-lg font-black text-white leading-tight">
                        {viewingShow.showDateTime ? new Date(viewingShow.showDateTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                      </p>
                      <p className="text-sm font-bold text-primary mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {viewingShow.showTime || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Booking Statistics */}
                  <div className="bg-gray-800/30 rounded-[2rem] border border-gray-800/50 overflow-hidden">
                    <div className="p-6 border-b border-gray-800/50 flex justify-between items-center">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Booking Statistics
                      </h4>
                      <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-[10px] font-black text-primary uppercase">Live Data</span>
                      </div>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Occupancy</p>
                          <div className="flex items-end gap-2">
                            <p className="text-4xl font-black text-white">
                              {viewingShow.screen?.seatLayout?.totalSeats
                                ? `${((Object.keys(viewingShow.occupiedSeats || {}).length / viewingShow.screen.seatLayout.totalSeats) * 100).toFixed(0)}%`
                                : "0%"}
                            </p>
                            <p className="text-sm font-bold text-gray-500 mb-1.5">
                              ({Object.keys(viewingShow.occupiedSeats || {}).length}/{viewingShow.screen?.seatLayout?.totalSeats || 0})
                            </p>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-gray-800 rounded-full mt-4 overflow-hidden border border-gray-700">
                            <div 
                              className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,51,102,0.5)]"
                              style={{ 
                                width: viewingShow.screen?.seatLayout?.totalSeats 
                                  ? `${(Object.keys(viewingShow.occupiedSeats || {}).length / viewingShow.screen.seatLayout.totalSeats) * 100}%` 
                                  : '0%' 
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Estimated Revenue</p>
                          <p className="text-4xl font-black text-primary">
                            ₹{(Object.keys(viewingShow.occupiedSeats || {}).length * (viewingShow.showPrice || 0)).toLocaleString()}
                          </p>
                          <p className="text-sm font-bold text-gray-500 mt-2">Based on ₹{viewingShow.showPrice || 0} avg price</p>
                        </div>
                      </div>

                      {/* Screen Details Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800/50">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Available</p>
                          <p className="text-xl font-black text-white">
                            {(viewingShow.screen?.seatLayout?.totalSeats || 0) - Object.keys(viewingShow.occupiedSeats || {}).length}
                          </p>
                        </div>
                        <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800/50">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Rows</p>
                          <p className="text-xl font-black text-white">{viewingShow.screen?.seatLayout?.rows || 0}</p>
                        </div>
                        <div className="bg-gray-900/40 p-4 rounded-2xl border border-gray-800/50">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Per Row</p>
                          <p className="text-xl font-black text-white">{viewingShow.screen?.seatLayout?.seatsPerRow || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Occupied Seats Map (Visual Tooltip) */}
                  {viewingShow.occupiedSeats && Object.keys(viewingShow.occupiedSeats).length > 0 && (
                    <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-800/50">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Booked Seats Map
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(viewingShow.occupiedSeats).map((seat) => (
                          <span
                            key={seat}
                            className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded-lg border border-red-500/20"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
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

export default AdminShows;
