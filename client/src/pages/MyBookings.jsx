import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import dateFormat from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { MapPin, Calendar, CreditCard, FileText, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const MyBookings = () => {
  const { axios, getToken, user, imageBaseURL } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyBookings = async () => {
    try {
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyBookings();
  }, [user]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && user) fetchMyBookings();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-24 md:pt-32 pb-20 min-h-screen">
      <BlurCircle top="100px" left="100px" />
      <BlurCircle bottom="0" right="500px" />

      <h1 className="text-2xl md:text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-gray-400 mb-8">Your booked tickets and payment details</p>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No bookings yet</p>
          <p className="text-gray-500 text-sm mt-2">Book tickets from Movies or Theatres to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {bookings.map((item) => {
            const theatre = item.theatre || item.theater;
            const posterPath = item.show?.movie?.poster_path;
            const posterUrl = posterPath?.startsWith("http")
              ? posterPath
              : (imageBaseURL || "https://image.tmdb.org/t/p/w300") + (posterPath || "");

            return (
              <div
                key={item._id}
                className="bg-gray-900/40 border border-gray-700 rounded-xl overflow-hidden hover:border-primary/30 transition"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-40 h-48 md:h-auto flex-shrink-0">
                    <img
                      src={posterUrl}
                      alt={item.show?.movie?.title || "Movie"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <h2 className="text-xl font-bold mb-2">{item.show?.movie?.title || "Movie"}</h2>

                    {theatre && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{theatre.name}</span>
                        {theatre.city && <span>• {theatre.city}</span>}
                      </div>
                    )}

                    {item.show?.showDateTime && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{dateFormat(item.show.showDateTime)}</span>
                        <span>
                          {new Date(item.show.showDateTime).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        {item.screen?.screenNumber && (
                          <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                            Screen {item.screen.screenNumber}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.bookedSeats?.map((seat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/20 text-primary rounded text-sm font-medium"
                        >
                          {seat.seatNumber} (₹{seat.price})
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-700">
                      <span className="text-lg font-bold text-primary">₹{item.amount}</span>
                      {item.isPaid ? (
                        <>
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                            Paid
                          </span>
                          {item.paymentMode && (
                            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
                              <CreditCard className="w-4 h-4" />
                              {item.paymentMode}
                            </span>
                          )}
                          {item.receiptUrl && (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4" />
                              Receipt
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                            Pending payment
                          </span>
                          {item.paymentLink && (
                            <a
                              href={item.paymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-sm font-medium transition"
                            >
                              Pay Now
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
