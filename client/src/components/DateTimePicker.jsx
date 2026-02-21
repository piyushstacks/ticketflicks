import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Clock, CalendarDays, Film } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const DateTimePicker = ({ movieId }) => {
  const navigate = useNavigate();
  const { axios, getAuthHeaders } = useAppContext();

  const [shows, setShows] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [theatresList, setTheatresList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateOffset, setDateOffset] = useState(0);

  const fetchShowsByMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/by-movie/${movieId}`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setShows(data.groupedShows || {});
        const theatres = Object.values(data.groupedShows || {})
          .map((t) => t.theatre)
          .filter((t, i, arr) => arr.findIndex((x) => x._id === t._id) === i);
        setTheatresList(theatres);

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
    return today.toISOString().split("T")[0];
  };

  const getDateRange = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + dateOffset);
    const actualStart = new Date(Math.max(startDate.getTime(), today.getTime()));
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
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() < today.getTime();
  };

  const isDateToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.toDateString() === today.toDateString();
  };

  const handleNavigateDate = (direction) => {
    const newOffset = dateOffset + direction * 7;
    if (newOffset < 0) return;
    setDateOffset(newOffset);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-12 sm:py-16">
        <div className="flex justify-center items-center h-64 sm:h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const filteredTheatres = selectedDate ? getTheatresWithShowsForDate(selectedDate) : [];

  return (
    <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-8 sm:py-12">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: "var(--color-accent-soft)" }}
        >
          <CalendarDays className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Select Date & Time
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            Choose your preferred date and showtime
          </p>
        </div>
      </div>

      {/* Date Carousel */}
      <div
        className="card p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleNavigateDate(-1)}
            className="btn-secondary p-2 rounded-xl flex-shrink-0 disabled:opacity-30"
            disabled={dateOffset === 0}
            title={dateOffset === 0 ? "Already at earliest date" : "Previous week"}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto flex-1 pb-1 no-scrollbar">
            {dateRangeArray.map((date) => {
              const isPast = isDateInPast(date);
              const isToday = isDateToday(date);
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => !isPast && setSelectedDate(date)}
                  disabled={isPast}
                  title={isPast ? "Past date" : isToday ? "Today" : ""}
                  className="flex-shrink-0 flex flex-col items-center justify-center w-14 sm:w-16 py-2.5 sm:py-3 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-accent)"
                      : isPast
                        ? "transparent"
                        : "var(--bg-elevated)",
                    color: isSelected ? "#fff" : isPast ? "var(--text-muted)" : "var(--text-primary)",
                    border: `1px solid ${isSelected ? "var(--color-accent)" : "var(--border)"}`,
                    opacity: isPast ? 0.4 : 1,
                    cursor: isPast ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="text-[10px] sm:text-xs font-medium uppercase opacity-70">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-lg sm:text-xl font-bold leading-tight">
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] sm:text-xs opacity-70">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  {isToday && (
                    <span
                      className="text-[9px] font-bold mt-0.5 uppercase tracking-wide"
                      style={{ color: isSelected ? "#fff" : "var(--color-accent)" }}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleNavigateDate(1)}
            className="btn-secondary p-2 rounded-xl flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Theatres & Shows */}
      {selectedDate && filteredTheatres.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredTheatres.map((theatre) => (
            <div key={theatre._id} className="card p-4 sm:p-6">
              {/* Theatre Header */}
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: "var(--color-accent-soft)" }}
                >
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-base sm:text-lg font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {theatre.name}
                  </h3>
                  <p
                    className="text-xs sm:text-sm truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {theatre.location}
                  </p>
                </div>
              </div>

              {/* Screens & Shows */}
              <div className="flex flex-col gap-5">
                {Object.entries(shows[theatre._id]?.screens || {})
                  .map(([screenId, screenData]) => {
                    const showsForDate = getShowsForDateAndTheatre(selectedDate, theatre._id, screenId);
                    return { screenId, screenData, showsForDate };
                  })
                  .filter((x) => x.showsForDate.length > 0)
                  .map(({ screenId, screenData, showsForDate }) => (
                    <div key={screenId}>
                      <div className="flex items-center gap-2 mb-3">
                        <Film className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                        <p
                          className="text-xs sm:text-sm font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Screen {screenData.screen.screenNumber}
                          <span style={{ color: "var(--text-muted)" }}>
                            {" "} -- {screenData.screen.seatLayout?.totalSeats || 0} seats
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-3">
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
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                            style={{
                              backgroundColor: "var(--color-accent-soft)",
                              color: "var(--color-accent)",
                              border: "1px solid transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--color-accent)";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--color-accent-soft)";
                              e.currentTarget.style.color = "var(--color-accent)";
                            }}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(show.showDateTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
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
        <div
          className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <CalendarDays className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            No shows available for this date
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Try selecting a different date
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <CalendarDays className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
            Please select a date to view shows
          </p>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
