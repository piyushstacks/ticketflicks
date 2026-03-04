import React, { useEffect, useState, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  Calendar, MapPin, Ticket, Trash2, Loader, CreditCard,
  CheckCircle, Clock, X, ExternalLink, Film, Star, Receipt,
} from "lucide-react";
import BlurCircle from "../components/BlurCircle";

// Tier badge colour classes — use inline styles for full light/dark compatibility
const TIER_STYLE = {
  Standard:  { bg: "rgba(14,165,233,0.15)",  border: "rgba(14,165,233,0.4)",  color: "rgb(56,189,248)"  },
  Normal:    { bg: "rgba(14,165,233,0.15)",  border: "rgba(14,165,233,0.4)",  color: "rgb(56,189,248)"  },
  Deluxe:    { bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.4)",  color: "rgb(167,139,250)" },
  Gold:      { bg: "rgba(234,179,8,0.15)",   border: "rgba(234,179,8,0.4)",   color: "rgb(250,204,21)"  },
  Premium:   { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.4)",  color: "rgb(251,191,36)"  },
  Platinum:  { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.4)",  color: "rgb(251,191,36)"  },
  Recliner:  { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)",  color: "rgb(52,211,153)"  },
  Couple:    { bg: "rgba(244,63,94,0.15)",   border: "rgba(244,63,94,0.4)",   color: "rgb(251,113,133)" },
};

/* ─────────────────────────────────────────────────────────── */
/* Receipt Modal                                               */
/* ─────────────────────────────────────────────────────────── */
const ReceiptModal = ({ booking, onClose }) => {
  if (!booking) return null;
  const show    = booking.show;
  const movie   = show?.movie;
  const theatre = booking.theatre || show?.theatre;
  const screen  = booking.screen  || show?.screen;

  const imgSrc = (movie?.poster_path && typeof movie.poster_path === 'string' && movie.poster_path.startsWith("http"))
    ? movie.poster_path
    : `https://image.tmdb.org/t/p/w300${movie?.poster_path || ""}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{
            background: "linear-gradient(135deg, var(--color-accent)/20, transparent)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full transition hover:opacity-70"
            style={{ backgroundColor: "var(--bg-elevated)" }}
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Booking Receipt
            </h2>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Booking ID: #{booking._id?.toString().slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Movie info */}
        <div className="flex gap-4 p-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <img
            src={imgSrc}
            alt={movie?.title}
            className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
            style={{ border: "1px solid var(--border)" }}
          />
          <div>
            <h3 className="font-bold text-lg leading-tight mb-1" style={{ color: "var(--text-primary)" }}>
              {movie?.title || "Movie"}
            </h3>
            {movie?.genres?.length > 0 && (
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {movie.genres.map((g) => g.name).join(", ")}
              </p>
            )}
            {movie?.vote_average > 0 && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  color: "rgb(251,191,36)",
                  backgroundColor: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Star className="w-3 h-3 fill-current" />
                {movie.vote_average.toFixed(1)}/10
              </span>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase font-semibold mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <MapPin className="w-3 h-3" /> Theatre
              </p>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{theatre?.name || "—"}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{theatre?.city || theatre?.location || ""}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Film className="w-3 h-3" /> Screen
              </p>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                Screen {screen?.screenNumber || screen?.name || "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase font-semibold mb-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Calendar className="w-3 h-3" /> Show Time
              </p>
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                {show?.showDateTime
                  ? new Date(show.showDateTime).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {show?.showDateTime
                  ? new Date(show.showDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                  : ""}
              </p>
            </div>
          </div>

          {/* Seats */}
          <div>
            <p className="text-xs uppercase font-semibold mb-2 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Ticket className="w-3 h-3" /> Seats
            </p>
            <div className="flex flex-wrap gap-2">
              {(booking.bookedSeats || []).map((seat, i) => {
                const seatNum  = typeof seat === "string" ? seat : seat.seatNumber;
                const tierName = typeof seat === "string" ? "Standard" : (seat.tierName || "Standard");
                const price    = typeof seat === "object" ? seat.price : null;
                const ts = TIER_STYLE[tierName] || { bg: "var(--bg-elevated)", border: "var(--border)", color: "var(--text-secondary)" };
                return (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
                    style={{ backgroundColor: ts.bg, borderColor: ts.border, color: ts.color }}
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
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <div>
              <p className="text-xs uppercase font-semibold" style={{ color: "var(--text-muted)" }}>
                Total Paid
              </p>
              <p className="text-2xl font-bold text-primary">₹{booking.amount}</p>
            </div>
            <div className="text-right">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: booking.isPaid ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                  color: booking.isPaid ? "rgb(74,222,128)" : "rgb(250,204,21)",
                  border: `1px solid ${booking.isPaid ? "rgba(34,197,94,0.4)" : "rgba(234,179,8,0.4)"}`,
                }}
              >
                {booking.isPaid ? <><CheckCircle className="w-3.5 h-3.5" /> Paid</> : <><Clock className="w-3.5 h-3.5" /> Pending</>}
              </span>
            </div>
          </div>

          {/* Stripe receipt link */}
          {booking.receiptUrl && (
            <a
              href={booking.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition btn-primary"
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

/* ─────────────────────────────────────────────────────────── */
/* Main Component                                              */
/* ─────────────────────────────────────────────────────────── */
const MyBookings = () => {
  const { axios, getToken, user, loading: appLoading } = useAppContext();
  const [bookings, setBookings]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [cancelingId, setCancelingId]         = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [retryCount, setRetryCount]           = useState(0);

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
      const params    = new URLSearchParams(window.location.search);
      const payment   = params.get("payment");
      const sessionId = params.get("session_id");

      if (payment !== "success" || !sessionId) return;

      if (!user && retryCount < 10) {
        setTimeout(() => setRetryCount((p) => p + 1), 500);
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
      <BlurCircle top="50px"    left="0"     />
      <BlurCircle bottom="100px" right="100px" />

      {selectedReceipt && (
        <ReceiptModal booking={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
        My Bookings
      </h1>
      <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>
        View and manage your movie tickets
      </p>

      {bookings.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>No bookings yet</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start booking your favourite movies!</p>
        </div>
      ) : (
        <div className="grid gap-5 max-w-5xl">
          {bookings.map((booking) => {
            const show    = booking.show;
            const movie   = show?.movie;
            const theatre = booking.theatre || show?.theatre;
            const screen  = booking.screen  || show?.screen;

            const imgSrc = (movie?.poster_path && typeof movie.poster_path === 'string' && movie.poster_path.startsWith("http"))
              ? movie.poster_path
              : `https://image.tmdb.org/t/p/w300${movie?.poster_path || ""}`;

            // Status badge style
            const statusStyle = booking.status === "cancelled"
              ? { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "rgb(252,165,165)" }
              : booking.isPaid
              ? { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", color: "rgb(74,222,128)" }
              : { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.4)", color: "rgb(250,204,21)" };

            return (
              <div
                key={booking._id}
                className="rounded-2xl overflow-hidden transition-all duration-300 group"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--color-accent)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Poster */}
                  <div className="sm:w-28 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={movie?.title || "Movie"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = "https://placehold.co/150x225?text=No+Image"; }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    {/* Title + status badge */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                          {movie?.title || "—"}
                        </h2>
                        {movie?.genres?.length > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {movie.genres.map((g) => g.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 flex-shrink-0"
                        style={{ backgroundColor: statusStyle.bg, borderColor: statusStyle.border, border: "1px solid", color: statusStyle.color }}
                      >
                        {booking.status === "cancelled"
                          ? <><X className="w-3.5 h-3.5" /> Cancelled</>
                          : booking.isPaid
                          ? <><CheckCircle className="w-3.5 h-3.5" /> Confirmed</>
                          : <><Clock className="w-3.5 h-3.5" /> Pending Payment</>}
                      </span>
                    </div>

                    {/* Info row */}
                    <div
                      className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-3 pb-3"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div>
                        <p className="text-xs uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Theatre</p>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{theatre?.name || "—"}</p>
                        {theatre?.city && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{theatre.city}</p>}
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Screen</p>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                          Screen {screen?.screenNumber || screen?.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-semibold flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Calendar className="w-3 h-3" /> Show Date
                        </p>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {show?.showDateTime
                            ? new Date(show.showDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {show?.showDateTime
                            ? new Date(show.showDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                            : ""}
                        </p>
                      </div>
                    </div>

                    {/* Seat badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(booking.bookedSeats || []).map((seat, i) => {
                        const seatNum  = typeof seat === "string" ? seat : seat.seatNumber;
                        const tierName = typeof seat === "string" ? "Standard" : (seat.tierName || "Standard");
                        const ts = TIER_STYLE[tierName] || { bg: "var(--bg-elevated)", border: "var(--border)", color: "var(--text-secondary)" };
                        return (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold"
                            style={{ backgroundColor: ts.bg, border: `1px solid ${ts.border}`, color: ts.color }}
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
                        <p className="text-xs uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Total</p>
                        <p className="text-xl font-bold text-primary">₹{booking.amount}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Receipt / details */}
                        <button
                          onClick={() => setSelectedReceipt(booking)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          {booking.isPaid ? "View Receipt" : "Details"}
                        </button>

                        {/* Pay Now — only if within 10-min window */}
                        {!booking.isPaid && booking.paymentLink && (
                          <a
                            href={booking.paymentLink}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition btn-primary"
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.1)",
                              color: "rgb(252,165,165)",
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}
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
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition"
                            style={{
                              backgroundColor: "rgba(34,197,94,0.1)",
                              color: "rgb(74,222,128)",
                              border: "1px solid rgba(34,197,94,0.3)",
                            }}
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
