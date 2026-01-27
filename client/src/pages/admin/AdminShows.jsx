import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Eye, Monitor, Calendar, Clock, Users, MapPin } from "lucide-react";
import { dummyShowsData, dummyTheatersData, dummyDateTimeData } from "../../assets/assets";

const AdminShows = () => {
  const { axios, getAuthHeaders } = useAppContext();
  const [shows, setShows] = useState([]);
  const [screens, setScreens] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState("");
  const [viewingShow, setViewingShow] = useState(null);
  const [viewingScreen, setViewingScreen] = useState(null);

  const fetchShows = async () => {
    try {
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
    }
  };

  const fetchScreens = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-screens", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setScreens(data.screens || []);
      } else {
        toast.error(data.message || "Failed to load screens");
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      toast.error("Failed to load screens");
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchShows(), fetchScreens(), fetchTheatres()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredShows = selectedTheatre
    ? shows.filter((show) => show.theatre?._id === selectedTheatre)
    : shows;

  const filteredScreens = selectedTheatre
    ? screens.filter((screen) => screen.theatre._id === selectedTheatre)
    : screens;

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
        <h1 className="text-3xl font-bold">Shows & Screen Details</h1>
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

      {/* Shows Section */}
      {filteredShows.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Scheduled Shows</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredShows.map((show) => (
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

                  {/* Theatre & Screen Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-gray-300">{show.theatre?.name || "Unknown Theatre"}</span>
                      </div>
                      {show.screen && (
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-primary" />
                          <span className="text-gray-300">Screen {show.screen.screenNumber}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-gray-300">
                          {show.showDateTime
                            ? new Date(show.showDateTime).toLocaleDateString()
                            : "No date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-gray-300">
                          {show.showDateTime
                            ? new Date(show.showDateTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No time"}
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
                          <span className="ml-2 text-gray-300">{show.screen.screenNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Total Seats:</span>
                          <span className="ml-2 text-gray-300">{show.screen.seatLayout?.totalSeats || "N/A"}</span>
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
                            <span className="ml-2 text-gray-300">{show.screen.seatLayout.seatsPerRow}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Booking Summary */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-2">Booking Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Booked Seats:</span>
                        <span className="ml-2 text-gray-300">{show.occupiedSeatsCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Available Seats:</span>
                        <span className="ml-2 text-gray-300">
                          {(show.totalCapacity || 0) - (show.occupiedSeatsCount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setViewingShow(show)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screens Section */}
      {filteredScreens.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Screen Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredScreens.map((screenData) => (
              <div
                key={screenData._id}
                className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-primary/50 transition"
              >
                <div className="space-y-4">
                  {/* Theatre Info */}
                  <div>
                    <h3 className="text-lg font-bold text-primary">{screenData.theatre.name}</h3>
                    <p className="text-gray-400 text-sm">{screenData.theatre.location}</p>
                    {screenData.theatre.manager && (
                      <p className="text-gray-500 text-xs mt-1">
                        Manager: {screenData.theatre.manager.name}
                      </p>
                    )}
                  </div>

                  {/* Screen Info */}
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">{screenData.screen.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Seats:</span>
                        <span className="text-gray-300">{screenData.screen.totalSeats || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          screenData.screen.status === 'active' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-gray-600/20 text-gray-400'
                        }`}>
                          {screenData.screen.status || 'N/A'}
                        </span>
                      </div>
                      {screenData.screen.layout && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rows:</span>
                            <span className="text-gray-300">{screenData.screen.layout.rows || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Seats per Row:</span>
                            <span className="text-gray-300">{screenData.screen.layout.seatsPerRow || "N/A"}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing Info */}
                  {screenData.screen.pricing && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-primary mb-2">Pricing</h4>
                      <div className="space-y-1 text-sm">
                        {typeof screenData.screen.pricing === 'object' ? (
                          Object.entries(screenData.screen.pricing).map(([tier, price]) => (
                            <div key={tier} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{tier}:</span>
                              <span className="text-gray-300">
                                ${typeof price === 'object' ? JSON.stringify(price) : price}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Base Price:</span>
                            <span className="text-gray-300">
                              ${typeof screenData.screen.pricing === 'object' ? JSON.stringify(screenData.screen.pricing) : screenData.screen.pricing}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => setViewingScreen(screenData)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {filteredShows.length === 0 && filteredScreens.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Shows or Screens Found</h3>
          <p className="text-gray-500">
            {selectedTheatre 
              ? "This theatre doesn't have any shows or screens configured yet."
              : "No shows or screens found across all theatres."}
          </p>
        </div>
      )}

      {/* Show Details Modal */}
      {viewingShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{viewingShow.movie?.title}</h2>
                <button
                  onClick={() => setViewingShow(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  {viewingShow.movie?.poster_path && (
                    <img
                      src={
                        viewingShow.movie.poster_path.startsWith("http")
                          ? viewingShow.movie.poster_path
                          : `https://image.tmdb.org/t/p/w200${viewingShow.movie.poster_path}`
                      }
                      alt={viewingShow.movie.title}
                      className="w-32 h-48 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-300">{viewingShow.movie?.overview}</p>
                    {viewingShow.movie?.genres && (
                      <div className="flex flex-wrap gap-2 mt-2">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Theatre:</span>
                    <span className="ml-2 text-gray-300">{viewingShow.theatre?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Screen:</span>
                    <span className="ml-2 text-gray-300">Screen {viewingShow.screen?.screenNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingShow.showDateTime
                        ? new Date(viewingShow.showDateTime).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time:</span>
                    <span className="ml-2 text-gray-300">
                      {viewingShow.showDateTime
                        ? new Date(viewingShow.showDateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {viewingShow.screen && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-2">Screen Layout</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Total Seats:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.totalSeats || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rows:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.rows || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Seats per Row:</span>
                        <span className="ml-2 text-gray-300">
                          {viewingShow.screen.seatLayout?.seatsPerRow || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Booked Seats:</span>
                        <span className="ml-2 text-gray-300">{viewingShow.occupiedSeatsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Details Modal */}
      {viewingScreen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Screen Details</h2>
                <button
                  onClick={() => setViewingScreen(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{viewingScreen.theatre.name}</h3>
                  <p className="text-gray-400">{viewingScreen.theatre.location}</p>
                  {viewingScreen.theatre.manager && (
                    <p className="text-gray-500 text-sm">
                      Manager: {viewingScreen.theatre.manager.name} ({viewingScreen.theatre.manager.email})
                    </p>
                  )}
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-primary mb-3">{viewingScreen.screen.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Seats:</span>
                      <span className="text-gray-300">{viewingScreen.screen.totalSeats || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingScreen.screen.status === 'active' 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {viewingScreen.screen.status || 'N/A'}
                      </span>
                    </div>
                    {viewingScreen.screen.layout && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rows:</span>
                          <span className="text-gray-300">{viewingScreen.screen.layout.rows || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Seats per Row:</span>
                          <span className="text-gray-300">{viewingScreen.screen.layout.seatsPerRow || "N/A"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {viewingScreen.screen.pricing && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">Pricing Structure</h4>
                    <div className="space-y-2">
                      {typeof viewingScreen.screen.pricing === 'object' ? (
                        Object.entries(viewingScreen.screen.pricing).map(([tier, price]) => (
                          <div key={tier} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{tier}:</span>
                            <span className="text-gray-300">
                              ${typeof price === 'object' ? JSON.stringify(price) : price}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Base Price:</span>
                          <span className="text-gray-300">
                            ${typeof viewingScreen.screen.pricing === 'object' ? JSON.stringify(viewingScreen.screen.pricing) : viewingScreen.screen.pricing}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewingScreen.screen.layout && viewingScreen.screen.layout.layout && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">Seat Layout Preview</h4>
                    <div className="text-sm text-gray-400">
                      <p>Layout configuration available in theatre management system.</p>
                      <p className="mt-1">Total Layout Seats: {viewingScreen.screen.layout.totalSeats}</p>
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
