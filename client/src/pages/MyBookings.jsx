import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import dateFormat from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { MapPin, Calendar, CreditCard, FileText, ExternalLink, Ticket } from "lucide-react";
import toast from "react-hot-toast";

const MyBookings = () => {
  const { axios, getToken, user, imageBaseURL, loading: appLoading } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMyBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyBookings();
  }, [user]);

  useEffect(() => {
    const confirmPaymentIfNeeded = async () => {
      if (appLoading) return;

      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      const sessionId = params.get("session_id");

      if (payment !== "success" || !sessionId) {
        setAuthChecked(true);
        return;
      }

      if (!user) {
        const stored = localStorage.getItem("auth") || sessionStorage.getItem("auth");
        if (stored && retryCount < 10) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 500);
          return;
        }
        setAuthChecked(true);
        return;
      }

      try {
        const token = await getToken();
        await axios.post(
          "/api/booking/confirm-stripe",
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Payment confirmed successfully!");
      } catch (error) {
        toast.error("Payment received, but booking confirmation is still processing.");
      } finally {
        params.delete("payment");
        params.delete("session_id");
        const next = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
        setAuthChecked(true);
        setRetryCount(0);
        fetchMyBookings();
      }
    };
    confirmPaymentIfNeeded();
  }, [user, appLoading, retryCount]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && user && authChecked) fetchMyBookings();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, authChecked]);

  if (isLoading) return <Loading />;

  return (
    <div className="relative px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 pt-24 md:pt-28 pb-20 min-h-screen">
      <BlurCircle top="100px" left="100px" />

      <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>My Bookings</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Your booked tickets and payment details</p>

      {bookings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Ticket className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>No bookings yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Book tickets to see them here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl">
          {bookings.map((item) => {
            const theatre = item.theatre;
            const posterPath = item.show?.movie?.poster_path;
            const posterUrl = posterPath?.startsWith("http")
              ? posterPath
              : (imageBaseURL || "https://image.tmdb.org/t/p/w300") + (posterPath || "");

            return (
              <div
                key={item._id}
                className="card overflow-hidden transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-36 h-44 sm:h-auto flex-shrink-0">
                    <img
                      src={posterUrl}
                      alt={item.show?.movie?.title || "Movie"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-5">
                    <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      {item.show?.movie?.title || "Movie"}
                    </h2>

                    {theatre && (
                      <div className="flex items-center gap-2 text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{theatre.name}</span>
                        {theatre.city && <span>- {theatre.city}</span>}
                      </div>
                    )}

                    {item.show?.showDateTime && (
                      <div className="flex flex-wrap items-center gap-2 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{dateFormat(item.show.showDateTime)}</span>
                        <span>
                          {new Date(item.show.showDateTime).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                        {item.screen?.screenNumber && (
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-medium"
                            style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                          >
                            Screen {item.screen.screenNumber}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.bookedSeats?.map((seat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-xs font-medium text-accent"
                          style={{ backgroundColor: "var(--color-accent-soft)" }}
                        >
                          {seat.seatNumber} ({'₹'}{seat.price})
                        </span>
                      ))}
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-3 pt-3"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <span className="text-lg font-bold text-accent">{'₹'}{item.amount}</span>
                      {item.isPaid ? (
                        <>
                          <span className="px-2.5 py-0.5 bg-green-500/15 text-green-500 rounded-full text-xs font-semibold">
                            Paid
                          </span>
                          {item.paymentMode && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                              <CreditCard className="w-3 h-3" />
                              {item.paymentMode}
                            </span>
                          )}
                          {item.receiptUrl && (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:underline text-xs"
                            >
                              <FileText className="w-3 h-3" />
                              Receipt
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-500 rounded-full text-xs font-semibold">
                            Pending
                          </span>
                          {item.paymentLink && (
                            <a
                              href={item.paymentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary px-4 py-1.5 text-xs"
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
