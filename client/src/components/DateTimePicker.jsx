import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const DateTimePicker = ({ movieId }) => {
  const navigate = useNavigate();
  const { axios, getAuthHeaders } = useAppContext();

  const [shows, setShows] = useState({}); // grouped by theatre -> screen -> shows
  const [selectedDate, setSelectedDate] = useState(null);
  const [theatresList, setTheatresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([]);
  const [dateOffset, setDateOffset] = useState(0);

  const fetchShowsByMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/by-movie/${movieId}`, {
        headers: getAuthHeaders(),
      });

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

  const getTheatresWithShowsForDate = (dateObj) => {
    if (!dateObj) return theatresList;
    const dateStr = dateObj.toISOString().split("T")[0];

    return theatresList.filter((theatre) => {
      const theatreShows = shows[theatre._id];
      if (!theatreShows?.screens) return false;
      return Object.keys(theatreShows.screens).some((screenId) => {
        const matches = getShowsForDateAndTheatre(dateObj, theatre._id, screenId);
        return matches.length > 0;
      });
    });
  };

  useEffect(() => {
    fetchShowsByMovie();
  }, [movieId]);

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const getDateRange = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate the actual start date with offset
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + dateOffset);
    
    // Ensure we never start before today
    const actualStart = new Date(Math.max(startDate.getTime(), today.getTime()));
    
    // Generate 7 days from the actual start
    for (let i = 0; i < 7; i++) {
      const date = new Date(actualStart);
      date.setDate(actualStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dateRangeArray = getDateRange();

  const getShowsForDateAndTheatre = (date, theatreId, screenId) => {
    if (!shows[theatreId]?.screens[screenId]) return [];

    const dateStr = date.toISOString().split("T")[0];
    return (shows[theatreId].screens[screenId].shows || []).filter((show) => {
      const showDate = new Date(show.showDateTime).toISOString().split("T")[0];
      return showDate === dateStr;
    });
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create a copy and normalize both dates to start of day
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Simple comparison - if check date is before today, it's past
    return checkDate.getTime() < today.getTime();
  };

  const isDateToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    return date.toDateString() === today.toDateString();
  };

  const handleNavigateDate = (direction) => {
    const newOffset = dateOffset + direction * 7;
    // Prevent navigation to past dates
    if (newOffset < 0) return;
    setDateOffset(newOffset);
  };

  if (loading) {
    return (
      <div className="px-6 md:px-16 lg:px-40 py-20">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-40 py-20">
      <h2 className="text-3xl font-bold mb-8">Select Show Date & Time</h2>

      {/* Date Carousel */}
      <div className="mb-12 bg-gray-900/30 backdrop-blur-md rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => handleNavigateDate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            disabled={dateOffset === 0}
            title={dateOffset === 0 ? "Already at earliest date" : "Previous week"}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 overflow-x-auto flex-1 pb-2">
            {dateRangeArray.map((date) => {
              const isPast = isDateInPast(date);
              const isToday = isDateToday(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isPast && setSelectedDate(date)}
                  disabled={isPast}
                  min={getTodayString()}
                  title={isPast ? "Past date - not available" : isToday ? "Today" : ""}
                  className={`flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-lg border-2 transition min-w-max ${
                    isSelected
                      ? "border-primary bg-primary/20"
                      : isPast
                      ? "border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50"
                      : "border-gray-600 hover:border-primary cursor-pointer"
                  }`}
                >
                  <span className={`font-bold text-lg ${isPast ? 'text-gray-500' : ''}`}>
                    {date.getDate()}
                  </span>
                  <span className={`text-xs ${isPast ? 'text-gray-500' : 'text-gray-400'}`}>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-xs ${isPast ? 'text-gray-500' : ''}`}>
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  {isToday && (
                    <span className="text-xs text-primary font-semibold mt-1">Today</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleNavigateDate(1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Theatres & Shows */}
      {selectedDate && theatresList.length > 0 ? (
        <div className="space-y-6">
          {getTheatresWithShowsForDate(selectedDate).map((theatre) => (
            <div
              key={theatre._id}
              className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{theatre.name}</h3>
                  <p className="text-sm text-gray-400">{theatre.location}</p>
                </div>
              </div>

              {/* Screens & Shows for this theatre */}
              <div className="space-y-6">
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
                        Screen {screenData.screen.screenNumber} • {screenData.screen.seatLayout?.totalSeats || 0} seats
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {showsForDate.map((show) => (
                          <button
                            key={show._id}
                            onClick={() => {
                              navigate(`/seat-layout/${show._id}`, {
                                state: {
                                  selectedDate: selectedDate.toISOString(),
                                  theatre: theatre,
                                },
                              });
                            }}
                            className="p-3 bg-gradient-to-br from-primary to-primary-dull hover:shadow-lg hover:shadow-primary/50 rounded-lg transition text-center font-semibold text-white active:scale-95 transform duration-200"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(show.showDateTime).toLocaleTimeString("en-US", {
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
      ) : selectedDate ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No shows available for this date
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            Please select a date to view shows
          </p>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
