import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { Calendar, MapPin, Users, Trash2, Loader } from "lucide-react";
import BlurCircle from "../components/BlurCircle";

const MyBookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancelingId(bookingId);
      const token = await getToken();
      const { data } = await axios.put(
        `/api/booking/${bookingId}/cancel`,
        { reason: "User cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Booking cancelled successfully");
        fetchMyBookings();
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 md:px-16 lg:px-40 pt-20 pb-20 overflow-hidden">
      <BlurCircle top="50px" left="0" />
      <BlurCircle bottom="100px" right="100px" />

      <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
      <p className="text-gray-400 mb-12">View and manage your movie tickets</p>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
          <p className="text-gray-500 text-sm">
            Start booking your favorite movies!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 max-w-5xl">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-gray-900/30 backdrop-blur-md border border-gray-700 hover:border-primary/50 rounded-lg overflow-hidden transition-all duration-300 group"
            >
              <div className="md:flex">
                {/* Movie Poster */}
                <div className="md:w-32 h-40 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={
                      "https://image.tmdb.org/t/p/w300" +
                      booking.show.movie.poster_path
                    }
                    alt={booking.show.movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Booking Details */}
                <div className="flex-1 p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {booking.show.movie.title}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-gray-800 rounded">
                        {booking.show.movie.genres
                          .map((g) => g.name)
                          .join(", ")}
                      </span>
                      <span className="px-2 py-1 bg-gray-800 rounded flex items-center gap-1">
                        ⭐ {booking.show.movie.vote_average.toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  {/* Theatre & Screen Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-700">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          Theatre
                        </p>
                        <p className="text-white font-semibold">
                          {booking.theatre.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {booking.theatre.address}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Screen
                      </p>
                      <p className="text-white font-semibold text-lg">
                        {booking.screen.screenNumber}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          Show Time
                        </p>
                        <p className="text-white font-semibold">
                          {new Date(
                            booking.show.showDateTime
                          ).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(
                            booking.show.showDateTime
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Booked Seats */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
                      Booked Seats
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {booking.bookedSeats.map((seat, idx) => {
                        const tierColors = {
                          Standard: "bg-blue-500/20 text-blue-400 border-blue-500/50",
                          Premium:
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                          VIP: "bg-red-500/20 text-red-400 border-red-500/50",
                        };
                        return (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-lg border font-semibold text-sm ${
                              tierColors[seat.tierName] ||
                              "bg-gray-800 text-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{seat.seatNumber}</span>
                              <span className="text-xs opacity-75">
                                ({seat.tierName})
                              </span>
                              <span className="text-xs opacity-75">
                                ₹{seat.price}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          Total Amount
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ₹{booking.amount}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold inline-block ${
                            booking.isPaid
                              ? "bg-green-600/20 text-green-400 border border-green-500/50"
                              : "bg-yellow-600/20 text-yellow-400 border border-yellow-500/50"
                          }`}
                        >
                          {booking.isPaid ? "✓ Confirmed" : "⏳ Pending Payment"}
                        </span>
                      </div>
                    </div>

                    {!booking.isPaid && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancelingId === booking._id}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancelingId === booking._id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Cancel Booking
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
