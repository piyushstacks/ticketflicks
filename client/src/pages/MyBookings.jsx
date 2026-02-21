import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import dateFormat from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { MapPin, Calendar, CreditCard, FileText, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const MyBookings = () => {
  const { axios, getToken, user, imageBaseURL, loading: appLoading } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  console.log("[MyBookings] RENDER - user:", user?.email, "appLoading:", appLoading, "authChecked:", authChecked, "retryCount:", retryCount);

  const fetchMyBookings = async () => {
    try {
      console.log("Fetching bookings for user:", user);
      const token = await getToken();
      console.log("Token retrieved:", token ? "Yes" : "No");
      
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Bookings response:", data);
      if (data.success) {
        setBookings(data.bookings || []);
        console.log("Bookings set:", data.bookings?.length || 0);
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
    console.log("[MyBookings] Auth state:", { user: user?.email, userId: user?.id });
  }, [user]);

  useEffect(() => {
    const confirmPaymentIfNeeded = async () => {
      console.log("[MyBookings] confirmPaymentIfNeeded called, user:", user?.email, "appLoading:", appLoading);
      
      // Don't proceed if app is still loading auth
      if (appLoading) {
        console.log("[MyBookings] App still loading, waiting...");
        return;
      }
      
      // Check for URL params first
      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      const sessionId = params.get("session_id");
      
      if (payment !== "success" || !sessionId) {
        console.log("[MyBookings] No payment success params, setting authChecked");
        setAuthChecked(true);
        return;
      }
      
      // We have payment success params - ensure auth is loaded
      if (!user) {
        console.log("[MyBookings] No user yet, retry count:", retryCount);
        
        // Check storage directly
        const stored = localStorage.getItem("auth") || sessionStorage.getItem("auth");
        if (stored && retryCount < 10) { // Max 10 retries (5 seconds)
          console.log("[MyBookings] Auth exists in storage, retrying in 500ms...");
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 500);
          return;
        }
        
        console.log("[MyBookings] No auth found or max retries reached");
        setAuthChecked(true);
        return;
      }

      console.log("[MyBookings] User available, confirming payment. URL params:", { payment, sessionId });
      
      try {
        console.log("[MyBookings] Confirming payment with session ID:", sessionId);
        const token = await getToken();
        console.log("[MyBookings] Got token for payment confirmation:", token ? "Yes" : "No");
        
        const response = await axios.post(
          "/api/booking/confirm-stripe",
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("[MyBookings] Payment confirmation response:", response.data);
        toast.success("Payment confirmed successfully!");
      } catch (error) {
        console.error("[MyBookings] Payment confirmation error:", error);
        console.error("[MyBookings] Error response:", error.response?.data);
        toast.error("Payment received, but booking confirmation is still processing.");
      } finally {
        params.delete("payment");
        params.delete("session_id");
        const next = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (next ? `?${next}` : "")
        );
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
            console.log("Booking item:", { 
              id: item._id, 
              isPaid: item.isPaid, 
              paymentLink: item.paymentLink,
              amount: item.amount 
            });
            const theatre = item.theatre;
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
