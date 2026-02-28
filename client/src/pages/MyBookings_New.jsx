import React, { useEffect, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Ticket, Trash2, Loader, CreditCard,
  CheckCircle, Clock, X, ExternalLink, Film, Star, Receipt,
} from "lucide-react";
import BlurCircle from "../components/BlurCircle";

const TIER_COLORS = {
  Standard:  "bg-sky-500/20 text-sky-300 border-sky-500/40",
  Deluxe:    "bg-violet-500/20 text-violet-300 border-violet-500/40",
  Premium:   "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Recliner:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Couple:    "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

const ReceiptModal = ({ booking, onClose }) => {
  if (!booking) return null;
  const show = booking.show;
  const movie = show?.movie;
  const theatre = booking.theatre || show?.theatre;
  const screen  = booking.screen  || show?.screen;

  const imgSrc = movie?.poster_path?.startsWith("http")
    ? movie.poster_path
    : `https://image.tmdb.org/t/p/w300${movie?.poster_path || ""}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/30 to-purple-600/20 px-6 pt-6 pb-4 border-b border-gray-700">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Booking Receipt</h2>
          </div>
          <p className="text-xs text-gray-400">Booking ID: #{booking._id?.toString().slice(-8).toUpperCase()}</p>
        </div>

        {/* Movie */}
        <div className="flex gap-4 p-6 border-b border-gray-800">
          <img src={imgSrc} alt={movie?.title} className="w-16 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-700" />
          <div>
            <h3 className="font-bold text-white text-lg leading-tight mb-1">{movie?.title || "Movie"}</h3>
            {movie?.genres?.length > 0 && (
              <p className="text-xs text-gray-400 mb-1">{movie.genres.map(g => g.name).join(", ")}</p>
            )}
            {movie?.vote_average > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400" /> {movie.vote_average.toFixed(1)}/10
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Theatre</p>
              <p className="text-white font-medium">{theatre?.name || "—"}</p>
              <p className="text-gray-400 text-xs">{theatre?.city || theatre?.location || ""}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1"><Film className="w-3 h-3" />Screen</p>
              <p className="text-white font-medium">Screen {screen?.screenNumber || screen?.name || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Show Time</p>
              <p className="text-white font-medium">
                {show?.showDateTime
                  ? new Date(show.showDateTime).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
              <p className="text-gray-400 text-sm">
                {show?.showDateTime
                  ? new Date(show.showDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                  : ""}
              </p>
            </div>
          </div>

          {/* Seats */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1"><Ticket className="w-3 h-3" />Seats</p>
            <div className="flex flex-wrap gap-2">
              {(booking.bookedSeats || []).map((seat, i) => {
                const seatNum = typeof seat === "string" ? seat : seat.seatNumber;
                const tierName = typeof seat === "string" ? "Standard" : (seat.tierName || "Standard");
                const price = typeof seat === "object" ? seat.price : null;
                return (
                  <div
                    key={i}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${TIER_COLORS[tierName] || "bg-gray-800 text-gray-300 border-gray-600"}`}
                  >
                    <span>{seatNum}</span>
                    <span className="opacity-70">({tierName})</span>
                    {price != null && <span className="opacity-70">₹{price}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price summary */}
          <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Paid</p>
              <p className="text-2xl font-bold text-primary">₹{booking.amount}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                booking.isPaid
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
              }`}>
                {booking.isPaid ? <><CheckCircle className="w-3.5 h-3.5" /> Paid</> : <><Clock className="w-3.5 h-3.5" /> Pending</>}
              </span>
            </div>
          </div>

          {/* Stripe Receipt link */}
          {booking.receiptUrl && (
            <a
              href={booking.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm font-semibold transition"
            >
              <ExternalLink className="w-4 h-4" />
              View Stripe Receipt
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const MyBookings = () => {
  const { axios, getToken, user, loading: appLoading, imageBaseURL } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setBookings(data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [axios, getToken]);

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
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelingId(null);
    }
  };

  // Confirm Stripe payment when returning from checkout
  useEffect(() => {
    const confirmPaymentIfNeeded = async () => {
      if (appLoading) return;
      const params = new URLSearchParams(window.location.search);
      const payment = params.get("payment");
      const sessionId = params.get("session_id");

      if (payment !== "success" || !sessionId) return;

      if (!user && retryCount < 10) {
        setTimeout(() => setRetryCount(p => p + 1), 500);
        return;
      }
      if (!user) return;

      try {
        const token = await getToken();
        await axios.post(
          "/api/booking/confirm-stripe",
          { sessionId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("🎉 Payment confirmed! Your seats are booked.");
      } catch (error) {
        console.error("[MyBookings] Payment confirm error:", error);
        toast.error("Payment received — booking confirmation is processing.");
      } finally {
        params.delete("payment");
        params.delete("session_id");
        const next = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (next ? `?${next}` : ""));
        setRetryCount(0);
        fetchMyBookings();
      }
    };
    confirmPaymentIfNeeded();
  }, [user, appLoading, retryCount]);

  useEffect(() => {
    if (user) fetchMyBookings();
  }, [user, fetchMyBookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 sm:px-6 md:px-16 lg:px-40 pt-24 pb-20 overflow-hidden">
      <BlurCircle top="50px" left="0" />
      <BlurCircle bottom="100px" right="100px" />

      {selectedReceipt && (
        <ReceiptModal booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>My Bookings</h1>
      <p className="text-gray-400 mb-10">View and manage your movie tickets</p>

      {bookings.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-400 text-lg mb-2">No bookings yet</p>
          <p className="text-gray-500 text-sm">Start booking your favourite movies!</p>
        </div>
      ) : (
        <div className="grid gap-5 max-w-5xl">
          {bookings.map((booking) => {
            const show    = booking.show;
            const movie   = show?.movie;
            const theatre = booking.theatre || show?.theatre;
            const screen  = booking.screen  || show?.screen;

            const imgSrc = movie?.poster_path?.startsWith("http")
              ? movie.poster_path
              : `https://image.tmdb.org/t/p/w300${movie?.poster_path || ""}`;

            return (
              <div
                key={booking._id}
                className="bg-gray-900/40 backdrop-blur-md border border-gray-700 hover:border-primary/50 rounded-2xl overflow-hidden transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Poster */}
                  <div className="sm:w-28 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={movie?.title || "Movie"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150x225?text=No+Image"; }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    {/* Movie title + status badge */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{movie?.title || "—"}</h2>
                        {movie?.genres?.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{movie.genres.map(g => g.name).join(", ")}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 flex-shrink-0 ${
                        booking.isPaid
                          ? "bg-green-500/20 text-green-400 border border-green-500/40"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                      }`}>
                        {booking.isPaid
                          ? <><CheckCircle className="w-3.5 h-3.5" /> Confirmed</>
                          : <><Clock className="w-3.5 h-3.5" /> Pending Payment</>}
                      </span>
                    </div>

                    {/* Info row */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-3 pb-3 border-b border-gray-700/50">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Theatre</p>
                        <p className="text-white font-medium">{theatre?.name || "—"}</p>
                        {theatre?.city && <p className="text-xs text-gray-400">{theatre.city}</p>}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Screen</p>
                        <p className="text-white font-medium">Screen {screen?.screenNumber || screen?.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> Show Date</p>
                        <p className="text-white font-medium">
                          {show?.showDateTime
                            ? new Date(show.showDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {show?.showDateTime
                            ? new Date(show.showDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Seats */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(booking.bookedSeats || []).map((seat, i) => {
                        const seatNum  = typeof seat === "string" ? seat : seat.seatNumber;
                        const tierName = typeof seat === "string" ? "Standard" : (seat.tierName || "Standard");
                        return (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-md border text-[11px] font-semibold ${TIER_COLORS[tierName] || "bg-gray-800 text-gray-300 border-gray-600"}`}
                            title={tierName}
                          >
                            {seatNum}
                          </span>
                        );
                      })}
                    </div>

                    {/* Amount + actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total</p>
                        <p className="text-xl font-bold text-primary">₹{booking.amount}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Receipt / details */}
                        <button
                          onClick={() => setSelectedReceipt(booking)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-700/60 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          {booking.isPaid ? "View Receipt" : "Details"}
                        </button>

                        {/* Pay Now — only if within 10-min window */}
                        {!booking.isPaid && booking.paymentLink && (
                          <a
                            href={booking.paymentLink}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay Now
                          </a>
                        )}

                        {/* Cancel */}
                        {!booking.isPaid && booking.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            disabled={cancelingId === booking._id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          >
                            {cancelingId === booking._id
                              ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Cancelling...</>
                              : <><Trash2 className="w-3.5 h-3.5" /> Cancel</>}
                          </button>
                        )}

                        {/* Stripe receipt link if paid */}
                        {booking.isPaid && booking.receiptUrl && (
                          <a
                            href={booking.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/40 rounded-lg text-xs font-semibold transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Stripe Receipt
                          </a>
                        )}
                      </div>
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
