import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ButtonLoader from "../components/ButtonLoader";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import BlurCircle from "../components/BlurCircle";
import { SEAT_TIERS } from "../components/SeatLayoutTemplates.js";

const SeatLayout = () => {
  const navigate = useNavigate();
  const { showId } = useParams();

  const { axios, getToken, user } = useAppContext();

  // State
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [occupiedSeats, setOccupiedSeats] = useState(new Set());
  const [lockedSeats, setLockedSeats] = useState(new Set());
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Constants
  const MAX_SEATS = 10;
  const REFRESH_INTERVAL = 30000; // 30 seconds

  // ── Tier helpers for screens_new format ──────────────────────────────
  // screens_new stores tiers as { name: 'Silver', price: 150, color: '#...' }
  // We normalise them into a name→pricing map used by the seat renderer.
  const screensTierMap = useMemo(() => {
    const m = {}; // tierName (e.g. 'Silver') → { price, color }
    const rawTiers = show?.screen?.seatTiers;
    if (!rawTiers) return m;

    const tiers = Array.isArray(rawTiers) ? rawTiers : Object.values(rawTiers);
    tiers.forEach((t) => {
      const name = t.name || t.tierName;
      if (name) {
        m[name] = {
          price: t.price || 150,
          color: t.color || "#94a3b8",
        };
      }
    });
    return m;
  }, [show]);

  // Build tier pricing map from show/screen data
  const tierPricingMap = useMemo(() => {
    const map = {};

    // First, try to get prices from show's seatTiers (old format: {tierName, price})
    if (show?.seatTiers && Array.isArray(show.seatTiers)) {
      show.seatTiers.forEach((tier) => {
        const nameToCode = {
          Standard: "S", Deluxe: "D", Premium: "P", Recliner: "R", Couple: "C",
        };
        const code = nameToCode[tier.tierName];
        if (code) {
          map[code] = {
            name: tier.tierName,
            price: tier.price,
            color: SEAT_TIERS[code]?.color || "#94a3b8",
          };
        }
      });
    }

    // Try screen's seatTiers — works for old {tierName,price,rows} AND new {name,price,color} formats
    if (
      Object.keys(map).length === 0 &&
      show?.screen?.seatTiers
    ) {
      const rawTiers = Array.isArray(show.screen.seatTiers)
        ? show.screen.seatTiers
        : Object.values(show.screen.seatTiers);

      rawTiers.forEach((tier) => {
        const tierName = tier.tierName || tier.name;
        if (!tierName) return;

        // Map well-known names to single-letter codes for the grid renderer
        const nameToCode = {
          Standard: "S", Deluxe: "D", Premium: "P", Recliner: "R", Couple: "C",
          // screens_new tier names
          Silver: "S", Gold: "D", Platinum: "P",
        };
        const code = nameToCode[tierName] || "S";
        map[code] = {
          name: tierName,
          price: tier.price,
          color: tier.color || SEAT_TIERS[code]?.color || "#94a3b8",
        };
      });
    }

    // Fallback to default SEAT_TIERS if no pricing found
    if (Object.keys(map).length === 0) {
      Object.entries(SEAT_TIERS).forEach(([code, tier]) => {
        map[code] = {
          name: tier.name,
          price: tier.basePrice,
          color: tier.color,
        };
      });
    }

    return map;
  }, [show, screensTierMap]);

  // ── Normalize seat layout ──────────────────────────────────────────────
  // Handles two different seatLayout formats:
  //   Format A (screen_tbl):  { layout: [["S","S",...]], rows, seatsPerRow, totalSeats }
  //   Format B (screens_new): [[{ seatNumber:"A1", tier:"Silver", isBooked:false }, ...]]
  const seatLayout = useMemo(() => {
    const rawLayout = show?.screen?.seatLayout;
    if (!rawLayout) return null;

    // ── Format A: already has a `.layout` sub-key with string codes ──────
    if (
      rawLayout.layout &&
      Array.isArray(rawLayout.layout) &&
      rawLayout.layout.length > 0
    ) {
      return rawLayout; // {layout: [[String]], rows, seatsPerRow, totalSeats}
    }

    // ── Format B: rawLayout is itself a 2-D array of objects/strings ─────
    if (Array.isArray(rawLayout) && rawLayout.length > 0) {
      // Check if first element is an array (2-D)
      if (Array.isArray(rawLayout[0])) {
        // Build the unified tier→code mapping
        const tierToCode = {
          Standard: "S", Deluxe: "D", Premium: "P", Recliner: "R", Couple: "C",
          Silver: "S", Gold: "D", Platinum: "P",
        };

        // Convert each cell: if it's an object {seatNumber,tier,...} → letter code
        const layout = rawLayout.map((row) =>
          row.map((cell) => {
            if (!cell) return "";
            if (typeof cell === "string") return cell; // already a code
            const tierName = cell.tier || cell.tierName || "Standard";
            return tierToCode[tierName] || "S";
          })
        );

        return {
          layout,
          rows: layout.length,
          seatsPerRow: layout[0]?.length || 0,
          totalSeats: layout.reduce((sum, r) => sum + r.filter(Boolean).length, 0),
        };
      }
    }

    return null;
  }, [show]);

  // Get seat code from layout position
  const getSeatCodeFromLayout = useCallback(
    (seatNumber) => {
      if (!seatLayout?.layout) return null;

      const rowLetter = String(seatNumber || "")
        .charAt(0)
        .toUpperCase();
      const colRaw = String(seatNumber || "").slice(1);
      const rowIndex = rowLetter.charCodeAt(0) - 65;
      const colIndex = parseInt(colRaw, 10) - 1;

      if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) return null;
      if (rowIndex < 0 || colIndex < 0) return null;

      const row = seatLayout.layout[rowIndex];
      if (!Array.isArray(row) || colIndex >= row.length) return null;

      return row[colIndex] || null;
    },
    [seatLayout],
  );

  // Get tier info for a seat (uses actual pricing from show/screen)
  const getSeatTierInfo = useCallback(
    (seatNumber) => {
      const code = getSeatCodeFromLayout(seatNumber);
      if (!code) return null;

      const tierInfo = tierPricingMap[code];
      if (!tierInfo) {
        // Fallback to default SEAT_TIERS
        const defaultTier = SEAT_TIERS[code];
        if (defaultTier) {
          return {
            tierName: defaultTier.name,
            price: defaultTier.basePrice,
            color: defaultTier.color,
            code,
          };
        }
        return null;
      }

      return {
        tierName: tierInfo.name,
        price: tierInfo.price,
        color: tierInfo.color,
        code,
      };
    },
    [getSeatCodeFromLayout, tierPricingMap],
  );

  // Get available categories in the current layout
  const availableCategories = useMemo(() => {
    if (!seatLayout?.layout) return [];

    const codesInLayout = new Set();
    seatLayout.layout.flat().forEach((code) => {
      if (code && code !== "") codesInLayout.add(code);
    });

    return Array.from(codesInLayout)
      .map((code) => {
        const tierInfo = tierPricingMap[code] || SEAT_TIERS[code];
        if (!tierInfo) return null;
        return {
          code,
          name: tierInfo.name || tierInfo.tierName,
          price: tierInfo.price || tierInfo.basePrice,
          color: tierInfo.color,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.price - b.price);
  }, [seatLayout, tierPricingMap]);

  // Get screen type label
  const screenTypeLabel = useMemo(() => {
    if (!seatLayout?.layout) return "Classic Screen";

    const flat = seatLayout.layout.flat().filter(Boolean);
    const hasRecliner = flat.includes("R");
    const hasCouple = flat.includes("C");
    const hasPremium = flat.includes("P");
    const hasDeluxe = flat.includes("D");

    if (hasCouple && hasRecliner) return "Premium Couple Screen";
    if (hasCouple) return "Couple Screen";
    if (hasRecliner && hasPremium) return "Luxury Screen";
    if (hasRecliner) return "Recliner Screen";
    if (hasPremium) return "Premium Screen";
    if (hasDeluxe) return "Deluxe Screen";
    return "Classic Screen";
  }, [seatLayout]);

  // Calculate selected seat details
  const selectedSeatDetails = useMemo(() => {
    return Array.from(selectedSeats)
      .map((seatNumber) => {
        const tierInfo = getSeatTierInfo(seatNumber);
        return {
          seatNumber,
          tierName: tierInfo?.tierName || "Standard",
          price: tierInfo?.price || 150,
          color: tierInfo?.color || "#94a3b8",
          code: tierInfo?.code || "S",
        };
      })
      .sort((a, b) => {
        const rowA = a.seatNumber.charAt(0);
        const rowB = b.seatNumber.charAt(0);
        if (rowA !== rowB) return rowA.localeCompare(rowB);
        return (
          parseInt(a.seatNumber.slice(1), 10) -
          parseInt(b.seatNumber.slice(1), 10)
        );
      });
  }, [selectedSeats, getSeatTierInfo]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedSeatDetails.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeatDetails]);

  // Price breakdown by tier
  const priceBreakdown = useMemo(() => {
    const breakdown = {};
    selectedSeatDetails.forEach((seat) => {
      if (!breakdown[seat.tierName]) {
        breakdown[seat.tierName] = {
          count: 0,
          price: seat.price,
          total: 0,
          color: seat.color,
        };
      }
      breakdown[seat.tierName].count++;
      breakdown[seat.tierName].total += seat.price;
    });
    return breakdown;
  }, [selectedSeatDetails]);

  // Fetch show details
  const getShowDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get(`/api/show/show/${showId}`);

      if (data.success && data.show) {
        setShow(data.show);
      } else {
        setError(data.message || "Show not found");
      }
    } catch (error) {
      console.error("Error fetching show:", error);
      setError("Failed to load show details");
    } finally {
      setLoading(false);
    }
  }, [showId, axios]);

  // Fetch occupied seats
  const fetchOccupiedSeats = useCallback(async () => {
    if (!showId) return;

    try {
      setSeatsLoading(true);
      const { data } = await axios.get(`/api/booking/seats/${showId}`);

      if (data.success) {
        const occupied = new Set();
        const locked = new Set();

        // Process occupied seats array
        if (Array.isArray(data.occupiedSeats)) {
          data.occupiedSeats.forEach((seat) => occupied.add(seat));
        }

        // Also check seatTiers for locked/occupied
        if (data.seatTiers && Array.isArray(data.seatTiers)) {
          data.seatTiers.forEach((tier) => {
            if (tier.occupiedSeats && typeof tier.occupiedSeats === "object") {
              Object.entries(tier.occupiedSeats).forEach(([seatNum, value]) => {
                if (typeof value === "string" && value.startsWith("LOCKED:")) {
                  locked.add(seatNum);
                } else if (value) {
                  occupied.add(seatNum);
                }
              });
            }
          });
        }

        setOccupiedSeats(occupied);
        setLockedSeats(locked);
        setLastRefresh(new Date());

        // Remove any selected seats that are now occupied/locked
        setSelectedSeats((prev) => {
          const newSelected = new Set(prev);
          let changed = false;
          prev.forEach((seat) => {
            if (occupied.has(seat) || locked.has(seat)) {
              newSelected.delete(seat);
              changed = true;
              toast.error(`Seat ${seat} is no longer available`);
            }
          });
          return changed ? newSelected : prev;
        });
      }
    } catch (error) {
      console.error("Error fetching occupied seats:", error);
    } finally {
      setSeatsLoading(false);
    }
  }, [showId, axios]);

  // Handle seat click
  const handleSeatClick = useCallback(
    (seatId) => {
      // Validate seat format
      if (!/^[A-Z]\d+$/.test(seatId)) {
        return;
      }

      // Check if occupied
      if (occupiedSeats.has(seatId)) {
        toast.error("This seat is already booked");
        return;
      }

      // Check if locked
      if (lockedSeats.has(seatId)) {
        toast.error("This seat is being booked by someone else");
        return;
      }

      // Check tier info exists (not an aisle)
      const tierInfo = getSeatTierInfo(seatId);
      if (!tierInfo) {
        return; // Aisle or empty cell
      }

      setSelectedSeats((prev) => {
        const newSelected = new Set(prev);

        if (newSelected.has(seatId)) {
          newSelected.delete(seatId);
          return newSelected;
        }

        if (newSelected.size >= MAX_SEATS) {
          toast.error(`Maximum ${MAX_SEATS} seats allowed`);
          return prev;
        }

        newSelected.add(seatId);
        return newSelected;
      });
    },
    [occupiedSeats, lockedSeats, getSeatTierInfo],
  );

  // Render individual seat
  const renderSeat = useCallback(
    (code, rowIndex, colIndex) => {
      const seatId = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;

      // Empty cell / aisle
      if (!code || code === "") {
        return (
          <div
            key={`empty-${rowIndex}-${colIndex}`}
            className="w-8 h-8 md:w-9 md:h-9"
          />
        );
      }

      const isSelected = selectedSeats.has(seatId);
      const isOccupied = occupiedSeats.has(seatId);
      const isLocked = lockedSeats.has(seatId);
      const tierInfo = getSeatTierInfo(seatId);
      const isUnavailable = isOccupied || isLocked;

      const seatColor = tierInfo?.color || "#94a3b8";

      return (
        <button
          key={seatId}
          onClick={() => handleSeatClick(seatId)}
          disabled={isUnavailable || seatsLoading}
          className={`
            relative w-8 h-8 md:w-9 md:h-9 rounded-md text-[9px] md:text-[10px] font-bold
            transition-all duration-200 ease-out flex items-center justify-center
            ${
              isSelected
                ? "ring-2 ring-white ring-offset-1 scale-110 z-10 shadow-lg"
                : "hover:scale-105"
            }
            ${
              isUnavailable
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer active:scale-95"
            }
          `}
          style={{
            backgroundColor: isSelected
              ? seatColor
              : isUnavailable
                ? "#374151"
                : `${seatColor}35`,
            border: `2px solid ${isSelected ? seatColor : isUnavailable ? "#4b5563" : seatColor}`,
            color: isSelected ? "#fff" : isUnavailable ? "#6b7280" : seatColor,
            boxShadow: isSelected ? `0 0 15px ${seatColor}50` : "none",
          }}
          title={`${tierInfo?.tierName || "Seat"} - ${seatId} - ₹${tierInfo?.price || 150}${isOccupied ? " (Booked)" : isLocked ? " (Being booked)" : ""}`}
        >
          {seatId}
          {isLocked && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse" />
          )}
        </button>
      );
    },
    [
      selectedSeats,
      occupiedSeats,
      lockedSeats,
      seatsLoading,
      getSeatTierInfo,
      handleSeatClick,
    ],
  );

  // Render seat row
  const renderSeatRow = useCallback(
    (rowData, rowIndex) => {
      if (!Array.isArray(rowData)) return null;

      const rowLetter = String.fromCharCode(65 + rowIndex);

      return (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-1 md:gap-1.5 mb-1.5"
        >
          <span className="w-5 text-right text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {rowLetter}
          </span>
          <div className="flex gap-1 md:gap-1.5">
            {rowData.map((code, colIndex) =>
              renderSeat(code, rowIndex, colIndex),
            )}
          </div>
          <span className="w-5 text-left text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {rowLetter}
          </span>
        </div>
      );
    },
    [renderSeat],
  );

  // Handle booking
  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    if (selectedSeats.size === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    try {
      setBookingLoading(true);

      // Refresh occupied seats before booking
      const { data: freshData } = await axios.get(
        `/api/booking/seats/${showId}`,
      );

      if (freshData.success) {
        const freshOccupied = new Set(freshData.occupiedSeats || []);
        const unavailable = [];

        selectedSeats.forEach((seat) => {
          if (freshOccupied.has(seat)) {
            unavailable.push(seat);
          }
        });

        if (unavailable.length > 0) {
          setOccupiedSeats(freshOccupied);
          setSelectedSeats((prev) => {
            const newSelected = new Set(prev);
            unavailable.forEach((s) => newSelected.delete(s));
            return newSelected;
          });
          toast.error(
            `Seats ${unavailable.join(", ")} are no longer available`,
          );
          setBookingLoading(false);
          return;
        }
      }

      // Prepare booking data with tier info
      const seatsWithTier = Array.from(selectedSeats).map((seatNumber) => {
        const tierInfo = getSeatTierInfo(seatNumber);
        return {
          seatNumber,
          tierName: tierInfo?.tierName || "Standard",
          price: tierInfo?.price || 150, // Add price here
        };
      });

      const token = await getToken();
      
      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId,
          selectedSeats: seatsWithTier,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      
      if (data.success) {
        // Backend returns data.url (Stripe session) or data.paymentLink
        const redirectUrl = data.url || data.paymentLink;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          toast.success("Booking created! No payment required.");
          navigate("/my-bookings");
        }
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchOccupiedSeats();
    toast.success("Seat availability refreshed");
  };

  // Effects
  useEffect(() => {
    getShowDetails();
  }, [getShowDetails]);

  useEffect(() => {
    if (show) {
      fetchOccupiedSeats();
    }
  }, [show, fetchOccupiedSeats]);

  // Auto-refresh
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(fetchOccupiedSeats, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [show, fetchOccupiedSeats]);

  // Loading state
  if (loading) return <Loading />;

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Error</h2>
        <p className="text-center mb-6" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // No show
  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Show Not Found</h2>
        <p className="text-center mb-6" style={{ color: "var(--text-muted)" }}>
          The show you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/movies")}
          className="px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg transition"
        >
          Browse Movies
        </button>
      </div>
    );
  }

  return (
     <div className="relative min-h-screen px-4 md:px-8 lg:px-16 xl:px-32 pt-20 pb-16 overflow-hidden bg-dark-gradient">
      <BlurCircle top="50px" left="0" />
      <BlurCircle bottom="100px" right="100px" />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary hover:text-primary-dull transition mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="max-w-5xl mx-auto">
          {/* Show Info Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold movie-title mb-3">
              {show.movie?.title || "Movie"}
            </h1>
            <div className="flex flex-wrap justify-center gap-3 movie-meta text-sm md:text-base">
              <span className="px-3 py-1 glass-card rounded-full">
                {show.theatre?.name || "Theatre"}
              </span>
              <span className="px-3 py-1 glass-card rounded-full">
                {show.screen?.name || `Screen ${show.screen?.screenNumber}`}
              </span>
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full font-medium">
                {screenTypeLabel}
              </span>
              <span className="px-3 py-1 glass-card rounded-full">
                {new Date(show.showDateTime).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

        {/* Seat Categories Legend */}
    <div className="glass-card backdrop-blur-lg rounded-xl p-5 mb-6 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Info className="w-4 h-4 text-[var(--text-muted)]" />
              Seat Categories & Pricing
            </h3>
            <button
            onClick={handleRefresh}
            disabled={seatsLoading}
            className="btn-secondary flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${seatsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {availableCategories.map((tier) => (
              <div key={tier.code} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md border-2 flex items-center justify-center text-[8px] font-bold"
                  style={{
                    backgroundColor: `${tier.color}35`,
                    borderColor: tier.color,
                    color: tier.color,
                  }}
                >
                  {tier.code}
                </div>
                <div className="text-sm">
                  <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{tier.name}</span>
                  <span className="text-primary ml-2 font-semibold">
                    ₹{tier.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2" style={{ borderColor: "var(--text-muted)", backgroundColor: "var(--bg-elevated)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-primary bg-primary shadow-lg shadow-primary/30" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 opacity-40" style={{ borderColor: "var(--text-muted)", backgroundColor: "var(--bg-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Booked</span>
            </div>
          </div>
        </div>

        {/* Screen */}
          <div className="text-center mb-6">
            <div className="w-3/4 max-w-md mx-auto h-2 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full mb-2" />
            <p className="movie-meta text-xs tracking-widest">SCREEN</p>
          </div>

        {/* Seat Layout */}
    <div className="glass-card backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/10 shadow-lg overflow-x-auto">
          {seatLayout?.layout && Array.isArray(seatLayout.layout) ? (
            <div className="flex flex-col items-center min-w-max">
              {seatLayout.layout.map((rowData, rowIndex) =>
                renderSeatRow(rowData, rowIndex),
              )}

              {/* Column numbers */}
              <div className="flex items-center justify-center gap-1 md:gap-1.5 mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="w-5" />
                {seatLayout.layout[0]?.map((_, colIndex) => (
                  <span
                    key={colIndex}
                    className="w-8 md:w-9 text-center text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {colIndex + 1}
                  </span>
                ))}
                <span className="w-5" />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p style={{ color: "var(--text-muted)" }}>Seat layout not available</p>
            </div>
          )}
        </div>

        {/* Selected Seats Summary */}
          {selectedSeats.size > 0 && (
            <div className="glass-card border border-green-500/30 rounded-xl p-5 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-400 mb-3">
                  Selected Seats ({selectedSeats.size})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeatDetails.map((seat) => (
                    <button
                      key={seat.seatNumber}
                      onClick={() => handleSeatClick(seat.seatNumber)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: `${seat.color}30`,
                        border: `2px solid ${seat.color}`,
                        color: "#fff",
                      }}
                      title="Click to remove"
                    >
                      {seat.seatNumber} • {seat.tierName} • ₹{seat.price}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Breakdown & Booking */}
    <div className="glass-card backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg">
        <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Booking Summary</h2>

          {selectedSeats.size > 0 ? (
            <>
              {/* Price breakdown by tier */}
              <div className="space-y-3 mb-6">
                {Object.entries(priceBreakdown).map(([tier, info]) => (
                  <div
                    key={tier}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span style={{ color: "var(--text-muted)" }}>
                        {tier} × {info.count}
                      </span>
                    </div>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      ₹{info.total}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="flex justify-between items-center py-4 mb-6"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{totalPrice}
                </span>
              </div>

              <button
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  className={`btn-primary w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${bookingLoading ? "bg-[var(--border-hover)] cursor-not-allowed opacity-50" : "active:scale-[0.98] shadow-lg shadow-accent/30"}`}
              >
                {bookingLoading ? (
                  <>
                    <ButtonLoader size={20} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{totalPrice}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-[var(--text-muted)] text-xs mt-4">
                {selectedSeats.size} seat{selectedSeats.size > 1 ? "s" : ""} •
                Secure payment via Stripe
              </p>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>No seats selected</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Select seats from the layout above to continue
              </p>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                Maximum {MAX_SEATS} seats allowed
              </p>
            </div>
          )}
        </div>

        {/* Last refresh info */}
        {lastRefresh && (
          <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30s
          </p>
        )}
      </div>
    </div>
  );
};

export default SeatLayout;
