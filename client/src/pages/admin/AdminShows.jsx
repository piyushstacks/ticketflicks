import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Eye, Monitor, Calendar, Clock, Users, MapPin } from "lucide-react";

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
        setTheatres(data.theatres || []);
      }
    } catch (error) {
      console.error("Error fetching theatres:", error);
    }
  };

  useEffect(() => {
    fetchShows();
    fetchTheatres();
  }, []);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shows Running</h1>
        <select
          value={selectedTheatre}
          onChange={(e) => setSelectedTheatre(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-primary outline-none transition"
        >
          <option value="">All Theatres</option>
          {theatres.map((theatre) => (
            <option key={theatre._id} value={theatre._id}>
              {theatre.name}
            </option>
          ))}
        </select>
      </div>

      {/* Shows Organized by Theatre */}
      <div className="space-y-8">
        {Object.values(showsByTheatre).map(({ theatre, shows: theatreShows }) => (
          <div key={theatre._id} className="space-y-4">
            {/* Theatre Header */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{theatre.name}</h2>
                <span className="text-gray-400">
                  {theatre.city && `${theatre.city}, ${theatre.location || ''}`}
                </span>
                <span className="ml-auto px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  {theatreShows.length} Shows
                </span>
              </div>
            </div>

            {/* Shows Grid for this Theatre */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {theatreShows.map((show) => (
                <div
                  key={show._id}
                  className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-primary/50 transition"
                >
                  <div className="space-y-4">
                    {/* Movie Info */}
                    <div className="flex gap-4">
                      {show.movie?.poster_path && (
                        <img
                          src={
                            show.movie.poster_path.startsWith("http")
                              ? show.movie.poster_path
                              : `https://image.tmdb.org/t/p/w200${show.movie.poster_path}`
                          }
                          alt={show.movie.title}
                          className="w-20 h-28 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{show.movie?.title || "Unknown Movie"}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {show.movie?.overview?.substring(0, 80)}...
                        </p>
                        {show.movie?.genres && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {show.movie.genres.slice(0, 3).map((genre) => (
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
                    </div>

                    {/* Show Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-primary" />
                          <span className="text-gray-300">Screen {show.screen?.screenNumber || show.screen?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-gray-300">
                            {show.showDateTime
                              ? new Date(show.showDateTime).toLocaleDateString()
                              : show.startDate
                              ? new Date(show.startDate).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-gray-300">
                            {show.showTime
                              ? show.showTime
                              : show.showDateTime
                              ? new Date(show.showDateTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "No time"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                            {show.language || "English"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Screen Details */}
                    {show.screen && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-primary mb-2">Screen Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Screen Number:</span>
                            <span className="ml-2 text-gray-300">{show.screen.screenNumber || show.screen.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Seats:</span>
                            <span className="ml-2 text-gray-300">
                              {show.screen.seatLayout?.totalSeats || "N/A"}
                            </span>
                          </div>
                          {show.screen.seatLayout?.rows && (
                            <div>
                              <span className="text-gray-400">Rows:</span>
                              <span className="ml-2 text-gray-300">{show.screen.seatLayout.rows}</span>
                            </div>
                          )}
                          {show.screen.seatLayout?.seatsPerRow && (
                            <div>
                              <span className="text-gray-400">Seats per Row:</span>
                              <span className="ml-2 text-gray-300">
                                {show.screen.seatLayout.seatsPerRow}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => setViewingShow(show)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg transition font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredShows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No shows found</p>
        </div>
      )}

      {/* Show Details Modal */}
      {viewingShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Show Details</h2>
              <button
                onClick={() => setViewingShow(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Movie Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Movie Information</h3>
                {viewingShow.movie?.poster_path && (
                  <img
                    src={
                      viewingShow.movie.poster_path.startsWith("http")
                        ? viewingShow.movie.poster_path
                        : `https://image.tmdb.org/t/p/w300${viewingShow.movie.poster_path}`
                    }
                    alt={viewingShow.movie.title}
                    className="w-full rounded-lg"
                  />
                )}
                <div>
                  <h4 className="font-semibold">{viewingShow.movie?.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{viewingShow.movie?.overview}</p>
                  {viewingShow.movie?.genres && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {viewingShow.movie.genres.map((genre) => (
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
              </div>

              {/* Show & Screen Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">Show & Screen Information</h3>
                
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-gray-400">Theatre:</span>
                    <span className="ml-2 text-gray-300">{viewingShow.theatre?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Screen:</span>
                    <span className="ml-2 text-gray-300">Screen {viewingShow.screen?.screenNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date & Time:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingShow.showDateTime
                        ? new Date(viewingShow.showDateTime).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Ticket Price:</span>
                    <span className="ml-2 text-gray-300">₹{viewingShow.showPrice}</span>
                  </div>
                </div>

                {viewingShow.screen && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Screen Layout</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Total Seats:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.totalSeats}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rows:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.rows}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Seats per Row:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.seatsPerRow}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Booked Seats:</span>
                        <span className="ml-2 text-gray-300">
                          {Object.keys(viewingShow.occupiedSeats || {}).length}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Booked Seats:</span>
                      <span className="text-gray-300">
                        {Object.keys(viewingShow.occupiedSeats || {}).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Available Seats:</span>
                      <span className="text-gray-300">
                        {(viewingShow.screen?.seatLayout?.totalSeats || 0) -
                          Object.keys(viewingShow.occupiedSeats || {}).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Occupancy Rate:</span>
                      <span className="text-gray-300">
                        {viewingShow.screen?.seatLayout?.totalSeats
                          ? `${(
                              (Object.keys(viewingShow.occupiedSeats || {}).length /
                                viewingShow.screen.seatLayout.totalSeats) *
                              100
                            ).toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-400">Total Revenue:</span>
                      <span className="text-primary">
                        ₹{Object.keys(viewingShow.occupiedSeats || {}).length * (viewingShow.showPrice || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingShow.occupiedSeats && Object.keys(viewingShow.occupiedSeats).length > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Booked Seats</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(viewingShow.occupiedSeats).map((seat) => (
                        <span
                          key={seat}
                          className="px-2 py-1 bg-red-600/20 text-red-400 text-xs rounded"
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
      )}
    </div>
  );
};

export default AdminShows;
