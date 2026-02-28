import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Calendar,
  Star,
  Film,
  ArrowLeft,
  Ticket,
  Users,
  Sparkles,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import Loading from "./Loading";

const MovieShowSelector = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios, imageBaseURL, user } = useAppContext();

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
        const matches = getShowsForDateAndTheatre(
          dateObj,
          theatre._id,
          screenId,
        );
        return matches.length > 0;
      });
    });
  };

  // Fetch movie details
  const fetchMovie = async () => {
    try {
      const { data } = await axios.get(`/api/show/movies/${id}`);
      if (data.success) {
        setMovie(data.movie);
      }
    } catch (error) {
      console.error("Error fetching movie:", error);
      toast.error("Failed to load movie details");
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
          .map((t) => t.theatre)
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
    const theatreShows = shows[theatreId];
    if (!theatreShows) return [];

    const screenShows = theatreShows.screens[screenId];
    if (!screenShows) return [];

    return screenShows.shows.filter((show) => {
      const showDate = new Date(show.showDateTime || show.startDate);

      // If show has endDate, check if selected date falls within startDate..endDate range
      if (show.endDate) {
        const start = new Date(show.startDate || show.showDateTime);
        const end   = new Date(show.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const check = new Date(date);
        check.setHours(12, 0, 0, 0);
        // Also check time of day matches (same show time)
        const checkStr = date.toDateString();
        const startStr = showDate.toDateString();
        // If the selected date is within range, the show time is valid for that day
        return check >= start && check <= end;
      }

      // Legacy: exact showDateTime date match
      return showDate.toDateString() === date.toDateString();
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

  // Handle show selection
  const handleShowClick = (showId) => {
    if (!user) {
      toast.error("Please login to book tickets");
      navigate("/login");
      return;
    }
    navigate(`/seat-layout/${showId}`);
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

  // Get total shows for selected date
  const getTotalShowsForDate = (date) => {
    let count = 0;
    getTheatresWithShowsForDate(date).forEach((theatre) => {
      Object.entries(shows[theatre._id]?.screens || {}).forEach(
        ([screenId]) => {
          count += getShowsForDateAndTheatre(
            date,
            theatre._id,
            screenId,
          ).length;
        },
      );
    });
    return count;
  };

  if (loading) return <Loading />;

  const filteredTheatres = selectedDate
    ? getTheatresWithShowsForDate(selectedDate)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pt-20">
      {/* Movie Header with Enhanced Design */}
      {movie && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          {/* Background Image with Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${imageBaseURL + (movie.backdrop_path || movie.poster_path || "")})`,
            }}
          />

          {/* Gradient Overlays for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-gray-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 md:left-16 z-10 flex items-center gap-2 px-4 py-2.5
            bg-gray-900/80 backdrop-blur-md hover:bg-gray-800/90 rounded-xl transition-all
            font-medium text-sm border border-gray-700/50 hover:border-primary/50
            active:scale-95 transform duration-200 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Details</span>
            <span className="sm:hidden">Back</span>
          </button>

          {/* Movie Info Overlay with Enhanced Layout */}
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 lg:px-40 pb-8 z-10">
            <div className="flex items-end gap-6">
              {/* Movie Poster */}
              <img
                src={imageBaseURL + (movie.poster_path || "")}
                alt={movie.title}
                className="w-24 h-36 md:w-32 md:h-48 rounded-xl object-cover shadow-2xl
                border-2 border-white/10 hidden sm:block transform hover:scale-105 transition-transform duration-300"
              />

              {/* Movie Details */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>NOW SHOWING</span>
                </div>

                <h1
                  className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2
                drop-shadow-2xl leading-tight"
                >
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-gray-200 text-sm md:text-base">
                  <span className="flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-yellow-400">
                      {movie.vote_average?.toFixed(1) || "N/A"}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {movie.runtime
                      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                      : "N/A"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {movie.release_date
                      ? new Date(movie.release_date).getFullYear()
                      : "N/A"}
                  </span>

                  {movie.genres && movie.genres.length > 0 && (
                    <span className="hidden md:inline-flex items-center gap-1.5">
                      <Film className="w-4 h-4" />
                      {movie.genres
                        .slice(0, 2)
                        .map((g) => g.name)
                        .join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selection with Enhanced Design */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/80 z-30 shadow-xl">
        <div className="px-6 md:px-16 lg:px-40 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Select Date
            </h2>
            {selectedDate && (
              <div className="text-sm text-gray-400">
                {getTotalShowsForDate(selectedDate)} shows available
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigateDate(-1)}
              disabled={dateOffset === 0}
              className={`p-2.5 rounded-lg transition-all ${
                dateOffset === 0
                  ? "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                  : "bg-gray-800 hover:bg-gray-700 text-white active:scale-95"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 overflow-x-auto flex-1 pb-2 scrollbar-hide">
              {dateRange.map((date) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate?.toDateString() === date.toDateString();

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center p-3 md:p-4
                    rounded-xl border-2 transition-all duration-300 min-w-[70px] md:min-w-[80px] relative
                    ${
                      isSelected
                        ? "border-primary bg-gradient-to-br from-primary/30 to-purple-600/30 shadow-lg shadow-primary/30 scale-105"
                        : "border-gray-700 hover:border-primary/50 hover:bg-gray-800/50"
                    }`}
                  >
                    {isToday && (
                      <span className="absolute -top-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                        Today
                      </span>
                    )}
                    <span
                      className={`font-bold text-xl md:text-2xl ${isSelected ? "text-primary" : "text-white"}`}
                    >
                      {date.getDate()}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {date.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleNavigateDate(1)}
              className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Theatres & Shows Section */}
      <div className="px-6 md:px-16 lg:px-40 py-10">
        {selectedDate && filteredTheatres.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Ticket className="w-7 h-7 text-primary" />
                Available Shows
              </h2>
              <div className="text-sm text-gray-400">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {filteredTheatres.map((theatre, index) => {
              const theatreShows = shows[theatre._id];
              const screenCount = Object.keys(
                theatreShows?.screens || {},
              ).length;

              return (
                <div
                  key={theatre._id}
                  className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-md
                  border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl
                  hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300
                  animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Theatre Header */}
                  <div
                    className="bg-gradient-to-r from-primary/20 via-purple-600/10 to-transparent
                  p-6 border-b border-gray-700/50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/20 rounded-xl backdrop-blur-sm border border-primary/30">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                            {theatre.name}
                          </h3>
                          <p className="text-gray-300 text-sm flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {theatre.location}, {theatre.city}
                          </p>
                          <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {screenCount}{" "}
                            {screenCount === 1 ? "Screen" : "Screens"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">
                            Rating
                          </div>
                          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-yellow-400">
                              4.5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theatre Screens & Shows */}
                  <div className="p-6 space-y-6">
                    {Object.entries(theatreShows?.screens || {})
                      .map(([screenId, screenData]) => {
                        const showsForDate = getShowsForDateAndTheatre(
                          selectedDate,
                          theatre._id,
                          screenId,
                        );
                        return { screenId, screenData, showsForDate };
                      })
                      .filter((x) => x.showsForDate.length > 0)
                      .map(({ screenId, screenData, showsForDate }) => (
                        <div key={screenId} className="space-y-4">
                          {/* Screen Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                              <p className="text-sm font-semibold text-gray-200">
                                Screen {screenData.screen?.screenNumber}
                              </p>
                              <span className="text-xs text-gray-500">•</span>
                              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {screenData.screen?.seatLayout?.totalSeats ||
                                  0}{" "}
                                seats
                              </p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {showsForDate.length}{" "}
                              {showsForDate.length === 1 ? "show" : "shows"}
                            </div>
                          </div>

                          {/* Show Times Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {showsForDate.map((show) => (
                              <button
                                key={show._id}
                                onClick={() => handleShowClick(show._id)}
                                className="group relative p-4 bg-gradient-to-br from-gray-800 to-gray-800/50
                                hover:from-primary hover:to-primary-dull rounded-xl transition-all duration-300
                                text-center font-semibold border border-gray-700
                                hover:border-primary hover:shadow-lg hover:shadow-primary/30
                                active:scale-95 transform"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <Clock className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                  <span className="text-white text-base">
                                    {new Date(
                                      show.showDateTime,
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-400 group-hover:text-white/80 transition-colors">
                                    Available
                                  </span>
                                </div>

                                {/* Hover effect overlay */}
                                <div
                                  className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0
                                opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedDate ? (
          /* No Shows Available State */
          <div className="text-center py-20 animate-fade-in">
            <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-2xl p-10">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Shows Available
              </h3>
              <p className="text-gray-400 mb-2">
                No shows are scheduled for this movie on{" "}
                <span className="text-primary font-semibold">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
              <p className="text-gray-500 text-sm">
                Try selecting a different date to see available shows
              </p>
            </div>
          </div>
        ) : (
          /* Select Date First State */
          <div className="text-center py-20 animate-fade-in">
            <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-2xl p-10">
              <div
                className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full
              flex items-center justify-center mx-auto mb-6 border border-primary/30"
              >
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Select a Date
              </h3>
              <p className="text-gray-400">
                Choose a date from the calendar above to view available shows
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MovieShowSelector;
