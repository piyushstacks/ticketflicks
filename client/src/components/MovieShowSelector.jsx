import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar, Star } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import Loading from "./Loading";

const MovieShowSelector = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios, imageBaseURL } = useAppContext();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState({}); // grouped by theatre -> screen -> shows
  const [selectedDate, setSelectedDate] = useState(null);
  const [theatresList, setTheatresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([]);
  const [dateOffset, setDateOffset] = useState(0);

  // Generate date range (7 days from current offset)
  const generateDateRange = (offset) => {
    const dates = [];
    const today = new Date();
    today.setDate(today.getDate() + offset * 7);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTheatresWithShowsForDate = (dateObj) => {
    if (!dateObj) return theatresList;
    const dateStr = dateObj.toDateString();

    return theatresList.filter((theatre) => {
      const theatreShows = shows[theatre._id];
      if (!theatreShows?.screens) return false;
      return Object.keys(theatreShows.screens).some((screenId) => {
        const matches = getShowsForDateAndTheatre(dateObj, theatre._id, screenId);
        return matches.length > 0;
      });
    });
  };

  // Fetch movie details
  const fetchMovie = async () => {
    try {
      const { data } = await axios.get(`/api/movies/${id}`);
      if (data.success) {
        setMovie(data.movie);
      }
    } catch (error) {
      console.error("Error fetching movie:", error);
    }
  };

  // Fetch shows for this movie (public endpoint)
  const fetchShowsByMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/public/shows/by-movie/${id}`);

      if (data.success) {
        setShows(data.groupedShows || {});
        // Extract unique theatres
        const theatres = Object.values(data.groupedShows || {})
          .map((t) => t.theatre || t.theater)
          .filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i);
        setTheatresList(theatres);

        // Set first date as selected if available
        if (!selectedDate) {
          const today = new Date();
          setSelectedDate(today);
        }
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

  // Get shows for specific date, theatre, and screen
  const getShowsForDateAndTheatre = (date, theatreId, screenId) => {
    const dateStr = date.toDateString();
    const theatreShows = shows[theatreId];
    if (!theatreShows) return [];

    const screenShows = theatreShows.screens[screenId];
    if (!screenShows) return [];

    return screenShows.shows.filter((show) => {
      const showDate = new Date(show.showDateTime || show.startDate);
      return showDate.toDateString() === dateStr;
    });
  };

  // Navigate dates
  const handleNavigateDate = (direction) => {
    const newOffset = dateOffset + direction;
    if (newOffset >= 0) {
      setDateOffset(newOffset);
      setDateRange(generateDateRange(newOffset));
    }
  };

  // Initialize data
  useEffect(() => {
    fetchMovie();
    fetchShowsByMovie();
    setDateRange(generateDateRange(0));
  }, [id]);

  useEffect(() => {
    setDateRange(generateDateRange(dateOffset));
  }, [dateOffset]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Movie Header */}
      {movie && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(${imageBaseURL + (movie.backdrop_path || movie.poster_path || "")})`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-gray-950" />

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 lg:px-40 pb-8 z-10">
            <div className="flex items-start gap-4">
              <img
                src={imageBaseURL + (movie.poster_path || "")}
                alt={movie.title}
                className="w-20 h-28 rounded-lg object-cover hidden md:block"
              />
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 text-balance">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-300 text-sm md:text-base">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {movie.vote_average?.toFixed(1) || "N/A"}
                  </span>
                  <span>
                    {movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A"}
                  </span>
                  <span>
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selection */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 z-20">
        <div className="px-6 md:px-16 lg:px-40 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleNavigateDate(-1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              disabled={dateOffset === 0}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 overflow-x-auto flex-1 pb-2">
              {dateRange.map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-lg border-2 transition min-w-max ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? "border-primary bg-primary/20"
                      : "border-gray-600 hover:border-primary"
                  }`}
                >
                  <span className="font-bold text-lg">{date.getDate()}</span>
                  <span className="text-xs text-gray-400">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-xs">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => handleNavigateDate(1)}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Theatres & Shows */}
      <div className="px-6 md:px-16 lg:px-40 py-8">
        {selectedDate && theatresList.length > 0 ? (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white mb-6">Select Show Time</h2>

            {getTheatresWithShowsForDate(selectedDate).map((theatre) => (
              <div
                key={theatre._id}
                className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{theatre.name}</h3>
                        <p className="text-gray-300">{theatre.location}, {theatre.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Cineplex</div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-semibold">4.5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {Object.entries(shows[theatre._id]?.screens || {})
                    .map(([screenId, screenData]) => {
                      const showsForDate = getShowsForDateAndTheatre(selectedDate, theatre._id, screenId);
                      return { screenId, screenData, showsForDate };
                    })
                    .filter((x) => x.showsForDate.length > 0)
                    .map(({ screenId, screenData, showsForDate }) => (
                      <div key={screenId}>
                        <p className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          Screen {screenData.screen?.screenNumber} • {screenData.screen?.seatLayout?.totalSeats || 0} seats
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {showsForDate.map((s) => (
                            <button
                              key={s._id}
                              onClick={() => navigate(`/seat-layout/${s._id}`)}
                              className="p-3 bg-gradient-to-br from-primary to-primary-dull hover:shadow-lg hover:shadow-primary/50 rounded-lg transition text-center font-semibold text-white active:scale-95 transform duration-200"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(s.showDateTime).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Shows Available</h3>
              <p className="text-gray-400">
                {selectedDate
                  ? "No shows are scheduled for this movie on the selected date."
                  : "Select a date to view available shows."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieShowSelector;
