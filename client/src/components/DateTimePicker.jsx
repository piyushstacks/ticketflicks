import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const DateTimePicker = ({ movieId }) => {
  const navigate = useNavigate();
  const { axios, getAuthHeaders } = useAppContext();

  const [shows, setShows] = useState({}); // grouped by theater -> screen -> shows
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
          .map((t) => t.theater)
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

  useEffect(() => {
    fetchShowsByMovie();
  }, [movieId]);

  const getDateRange = () => {
    const dates = [];
    const today = new Date();
    today.setDate(today.getDate() + dateOffset);

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
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

  const handleNavigateDate = (direction) => {
    setDateOffset((prev) => prev + direction * 7);
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
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 overflow-x-auto flex-1 pb-2">
            {dateRangeArray.map((date) => (
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

      {/* Theatres & Shows */}
      {selectedDate && theatresList.length > 0 ? (
        <div className="space-y-6">
          {theatresList.map((theatre) => (
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
                {Object.entries(shows[theatre._id]?.screens || {}).map(
                  ([screenId, screenData]) => {
                    const showsForDate = getShowsForDateAndTheatre(
                      selectedDate,
                      theatre._id,
                      screenId
                    );

                    return (
                      <div key={screenId}>
                        <p className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          Screen {screenData.screen.screenNumber} •{" "}
                          {screenData.screen.seatLayout?.totalSeats || 0} seats
                        </p>

                        {showsForDate.length > 0 ? (
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
                                  {new Date(show.showDateTime).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    }
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm italic">
                            No shows available for this screen
                          </p>
                        )}
                      </div>
                    );
                  }
                )}

                {Object.keys(shows[theatre._id]?.screens || {}).length === 0 && (
                  <p className="text-gray-500 text-sm italic">
                    No screens available for this theatre
                  </p>
                )}
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
