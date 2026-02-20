import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import ButtonLoader from "../components/ButtonLoader";
import {
  ArrowRightIcon,
  ClockIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { SEAT_TIERS } from "../components/SeatLayoutTemplates.js";

const SeatLayout = () => {
  const navigate = useNavigate();
  const { id, date } = useParams();
  const { axios, getToken, user } = useAppContext();

  // State management
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState(new Set());
  const [lockedSeats, setLockedSeats] = useState(new Set());
  const [bookingLoading, setBookingLoading] = useState(false);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatLayout, setSeatLayout] = useState(null);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Constants
  const MAX_SEATS = 10;
  const REFRESH_INTERVAL = 30000; // 30 seconds

  // Get seat code from layout
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

  // Get screen type label
  const getScreenTypeLabel = useCallback(() => {
    const layout = seatLayout?.layout;
    if (!layout) return "Standard Screen";

    const flat = layout.flat().filter(Boolean);
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

  // Get screen category icon/badge
  const getScreenCategoryBadge = useCallback(() => {
    const label = getScreenTypeLabel();
    const badges = {
      "Premium Couple Screen": {
        icon: "💑",
        color: "from-pink-600/30 to-purple-600/30",
        border: "border-pink-500/30",
      },
      "Couple Screen": {
        icon: "💑",
        color: "from-pink-600/30 to-red-600/30",
        border: "border-pink-500/30",
      },
      "Luxury Screen": {
        icon: "👑",
        color: "from-yellow-600/30 to-orange-600/30",
        border: "border-yellow-500/30",
      },
      "Recliner Screen": {
        icon: "🛋️",
        color: "from-red-600/30 to-orange-600/30",
        border: "border-red-500/30",
      },
      "Premium Screen": {
        icon: "⭐",
        color: "from-purple-600/30 to-blue-600/30",
        border: "border-purple-500/30",
      },
      "Deluxe Screen": {
        icon: "✨",
        color: "from-blue-600/30 to-cyan-600/30",
        border: "border-blue-500/30",
      },
      "Classic Screen": {
        icon: "🎬",
        color: "from-gray-600/30 to-slate-600/30",
        border: "border-gray-500/30",
      },
    };
    return badges[label] || badges["Classic Screen"];
  }, [getScreenTypeLabel]);

  // Calculate selected seat details with memoization
  const selectedSeatDetails = useMemo(() => {
    return Array.from(selectedSeats)
      .map((seatNumber) => {
        const code = getSeatCodeFromLayout(seatNumber);
        const tier = code ? SEAT_TIERS[code] : null;
        
        // Get actual price from show data
        let actualPrice = 150; // fallback
        if (show?.seatTiers && Array.isArray(show.seatTiers)) {
          const row = seatNumber.charAt(0);
          for (const showTier of show.seatTiers) {
            const rows = showTier.rows || [];
            if (rows.includes(row)) {
              actualPrice = showTier.price || 150;
              break;
            }
          }
          
          // If no row-specific tier found, try to match by tier name
          if (tier && tier.name) {
            const matchingTier = show.seatTiers.find(t => t.tierName === tier.name);
            if (matchingTier && matchingTier.price) {
              actualPrice = matchingTier.price;
            }
          }
        } else {
          // Use hardcoded prices as fallback
          actualPrice = tier?.basePrice || 150;
        }
        
        return {
          seatNumber,
          code,
          tierName: tier?.name || "Standard",
          price: actualPrice,
          color: tier?.color || "#94a3b8",
        };
      })
      .sort((a, b) => {
        // Sort by row first, then by seat number
        const rowA = a.seatNumber.charAt(0);
        const rowB = b.seatNumber.charAt(0);
        if (rowA !== rowB) return rowA.localeCompare(rowB);
        const numA = parseInt(a.seatNumber.slice(1), 10);
        const numB = parseInt(b.seatNumber.slice(1), 10);
        return numA - numB;
      });
  }, [selectedSeats, getSeatCodeFromLayout, show]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedSeatDetails.reduce((sum, s) => sum + (s.price || 0), 0);
  }, [selectedSeatDetails]);

  // Calculate price breakdown by tier
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

  // Fetch show data
  const getShow = useCallback(async () => {
    try {
      setError(null);
      const { data } = await axios.get(`/api/show/show/${id}`);

      if (!data?.success || !data?.show) {
        setError("Show not found or unavailable");
        return;
      }

      const normalized = {
        movie: data.show.movie,
        theatre: data.show.theatre,
        screen: data.show.screen,
        seatTiers: data.show.seatTiers,
        dateTime: {
          [date]: [
            {
              time: data.show.showDateTime,
              showId: data.show._id,
              screen: data.show.screen,
              theatre: data.show.theatre,
            },
          ],
        },
      };

      setShow(normalized);

      if (data.show?.screen?.seatLayout) {
        setSeatLayout(data.show.screen.seatLayout);
      }

      // Auto-select the timing for this show/date
      setSelectedTime(normalized.dateTime?.[date]?.[0] || null);
    } catch (error) {
      console.error("Error fetching show:", error);
      setError("Failed to load show details. Please try again.");
    }
  }, [id, date, axios]);

  // Fetch occupied seats
  const fetchOccupiedSeats = useCallback(
    async (showIdToFetch) => {
      if (!showIdToFetch) return;

      try {
        setSeatsLoading(true);
        const { data } = await axios.get(`/api/booking/seats/${showIdToFetch}`);

        if (data.success) {
          const occupied = new Set();
          const locked = new Set();

          // Process occupied seats
          if (Array.isArray(data.occupiedSeats)) {
            data.occupiedSeats.forEach((seat) => {
              occupied.add(seat);
            });
          }

          // Also check seatTiers for locked/occupied seats
          if (data.seatTiers && Array.isArray(data.seatTiers)) {
            data.seatTiers.forEach((tier) => {
              if (
                tier.occupiedSeats &&
                typeof tier.occupiedSeats === "object"
              ) {
                Object.entries(tier.occupiedSeats).forEach(
                  ([seatNum, value]) => {
                    if (
                      typeof value === "string" &&
                      value.startsWith("LOCKED:")
                    ) {
                      locked.add(seatNum);
                    } else if (value) {
                      occupied.add(seatNum);
                    }
                  },
                );
              }
            });
          }

          setOccupiedSeats(occupied);
          setLockedSeats(locked);
          setLastRefresh(Date.now());

          // Clear any selected seats that are now occupied/locked
          setSelectedSeats((prev) => {
            const newSelected = new Set(prev);
            prev.forEach((seat) => {
              if (occupied.has(seat) || locked.has(seat)) {
                newSelected.delete(seat);
                toast.error(`Seat ${seat} is no longer available`);
              }
            });
            return newSelected;
          });
        } else {
          toast.error(data.message || "Failed to load seat availability");
        }
      } catch (error) {
        console.error("Error fetching occupied seats:", error);
        toast.error("Failed to load seat availability");
      } finally {
        setSeatsLoading(false);
      }
    },
    [axios],
  );

  // Handle seat click
  const handleSeatClick = useCallback(
    (seatId) => {
      if (!selectedTime) {
        toast.error("Please select a show time first");
        return;
      }

      // Validate seat format
      if (!/^[A-Z]\d+$/.test(seatId)) {
        console.error("Invalid seat format:", seatId);
        return;
      }

      // Check if seat is occupied
      if (occupiedSeats.has(seatId)) {
        toast.error("This seat is already booked");
        return;
      }

      // Check if seat is locked
      if (lockedSeats.has(seatId)) {
        toast.error("This seat is currently being booked by someone else");
        return;
      }

      // Toggle seat selection
      setSelectedSeats((prev) => {
        const newSelected = new Set(prev);

        if (newSelected.has(seatId)) {
          // Deselect seat
          newSelected.delete(seatId);
          return newSelected;
        } else {
          // Check max seats limit
          if (newSelected.size >= MAX_SEATS) {
            toast.error(`You can only select up to ${MAX_SEATS} seats`);
            return prev;
          }
          // Select seat
          newSelected.add(seatId);
          return newSelected;
        }
      });
    },
    [selectedTime, occupiedSeats, lockedSeats],
  );

  // Get seat color based on type
  const getSeatColor = useCallback((seatType) => {
    const tier = SEAT_TIERS[seatType];
    return tier ? tier.color : "#94a3b8";
  }, []);

  // Get seat name based on type
  const getSeatName = useCallback((seatType) => {
    const tier = SEAT_TIERS[seatType];
    return tier ? tier.name : "Standard";
  }, []);

  // Get seat price based on type
  const getSeatPrice = useCallback((seatType, seatNumber) => {
    // First try to get price from show's seatTiers
    if (show?.seatTiers && Array.isArray(show.seatTiers)) {
      const row = seatNumber ? seatNumber.charAt(0) : '';
      for (const tier of show.seatTiers) {
        const rows = tier.rows || [];
        if (rows.includes(row)) {
          return tier.price || 150;
        }
      }
      
      // If no row-specific tier found, try to match by tier name
      const tierInfo = SEAT_TIERS[seatType];
      if (tierInfo) {
        const matchingTier = show.seatTiers.find(t => t.tierName === tierInfo.name);
        if (matchingTier && matchingTier.price) {
          return matchingTier.price;
        }
      }
    }
    
    // Fallback to hardcoded prices
    const tier = SEAT_TIERS[seatType];
    return tier ? tier.basePrice : 150;
  }, [show]);

  // Render individual seat
  const renderSeat = useCallback(
    (seatType, row, col) => {
      const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
      const isSelected = selectedSeats.has(seatId);
      const isOccupied = occupiedSeats.has(seatId);
      const isLocked = lockedSeats.has(seatId);
      const seatColor = getSeatColor(seatType);
      const seatName = getSeatName(seatType);
      const seatPrice = getSeatPrice(seatType, seatId);

      // Empty space
      if (!seatType || seatType === "" || seatType === null) {
        return (
          <div key={`empty-${row}-${col}`} className="w-7 h-7 md:w-8 md:h-8" />
        );
      }

      const isUnavailable = isOccupied || isLocked;

      return (
        <button
          key={seatId}
          onClick={() => handleSeatClick(seatId)}
          disabled={isUnavailable || seatsLoading}
          className={`
          relative h-7 w-7 md:h-8 md:w-8 rounded-md text-[10px] md:text-xs font-bold
          transition-all duration-200 ease-out
          ${
            isSelected
              ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110 z-10 shadow-lg"
              : "hover:scale-105 hover:z-5"
          }
          ${
            isUnavailable
              ? "cursor-not-allowed opacity-40 bg-gray-700 border-gray-600"
              : "cursor-pointer active:scale-95"
          }
          ${seatsLoading ? "animate-pulse" : ""}
        `}
          style={{
            backgroundColor: isSelected
              ? seatColor
              : isUnavailable
                ? "#374151"
                : `${seatColor}30`,
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: isSelected
              ? seatColor
              : isUnavailable
                ? "#4b5563"
                : seatColor,
            color: isSelected
              ? "#ffffff"
              : isUnavailable
                ? "#6b7280"
                : seatColor,
            boxShadow: isSelected ? `0 0 12px ${seatColor}60` : "none",
          }}
          title={`${seatName} - Seat ${seatId} - ₹${seatPrice}${isOccupied ? " (Booked)" : isLocked ? " (Being booked)" : ""}`}
        >
          {seatId}
          {isLocked && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          )}
        </button>
      );
    },
    [
      selectedSeats,
      occupiedSeats,
      lockedSeats,
      seatsLoading,
      getSeatColor,
      getSeatName,
      getSeatPrice,
      handleSeatClick,
    ],
  );

  // Render seat row
  const renderSeatRow = useCallback(
    (rowData, rowIndex) => {
      if (!rowData || !Array.isArray(rowData)) return null;

      const rowLetter = String.fromCharCode(65 + rowIndex);

      return (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-1 md:gap-1.5 mb-1.5"
        >
          <span className="w-6 text-right text-xs text-gray-400 font-semibold mr-1">
            {rowLetter}
          </span>
          <div className="flex gap-1 md:gap-1.5">
            {rowData.map((seatType, colIndex) =>
              renderSeat(seatType, rowIndex, colIndex),
            )}
          </div>
          <span className="w-6 text-left text-xs text-gray-400 font-semibold ml-1">
            {rowLetter}
          </span>
        </div>
      );
    },
    [renderSeat],
  );

  // Book tickets
  const bookTickets = async () => {
    try {
      if (!user) {
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }

      if (!selectedTime) {
        toast.error("Please select a show time");
        return;
      }

      if (selectedSeats.size === 0) {
        toast.error("Please select at least one seat");
        return;
      }

      setBookingLoading(true);

      // Refresh seat availability one more time before booking
      const { data: freshData } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}`,
      );

      if (freshData.success) {
        const freshOccupied = new Set(freshData.occupiedSeats || []);
        const unavailableSeats = [];

        selectedSeats.forEach((seat) => {
          if (freshOccupied.has(seat)) {
            unavailableSeats.push(seat);
          }
        });

        if (unavailableSeats.length > 0) {
          setOccupiedSeats(freshOccupied);
          setSelectedSeats((prev) => {
            const newSelected = new Set(prev);
            unavailableSeats.forEach((seat) => newSelected.delete(seat));
            return newSelected;
          });
          toast.error(
            `Seats ${unavailableSeats.join(", ")} are no longer available`,
          );
          setBookingLoading(false);
          return;
        }
      }

      const bookingData = {
        showId: selectedTime.showId,
        selectedSeats: Array.from(selectedSeats).map((seatId) => ({
          seatNumber: seatId,
        })),
      };

      const { data } = await axios.post("/api/booking/create", bookingData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        let errorMessage = data.message || "Booking failed. Please try again.";

        if (errorMessage.toLowerCase().includes("not available")) {
          errorMessage =
            "Some seats are no longer available. Please refresh and try again.";
          fetchOccupiedSeats(selectedTime.showId);
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Booking error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        bookingData: bookingData
      });
      toast.error(
        error.response?.data?.message || "Booking failed. Please try again.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    if (selectedTime?.showId) {
      fetchOccupiedSeats(selectedTime.showId);
      toast.success("Seat availability refreshed");
    }
  };

  // Effects
  useEffect(() => {
    getShow();
  }, [getShow]);

  useEffect(() => {
    if (selectedTime?.showId) {
      setSelectedSeats(new Set());
      fetchOccupiedSeats(selectedTime.showId);
    }
  }, [selectedTime?.showId, fetchOccupiedSeats]);

  // Auto-refresh seats periodically
  useEffect(() => {
    if (!selectedTime?.showId) return;

    const interval = setInterval(() => {
      fetchOccupiedSeats(selectedTime.showId);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [selectedTime?.showId, fetchOccupiedSeats]);

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
        <p className="text-gray-400 text-center mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-primary hover:bg-primary-dull rounded-lg transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Loading state
  if (!show) {
    return <Loading />;
  }

  const screenBadge = getScreenCategoryBadge();

  return (
    <div className="flex flex-col lg:flex-row px-4 md:px-8 lg:px-16 xl:px-40 py-24 md:py-32 gap-6 lg:gap-8">
      {/* Sidebar - Show Info & Timing */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
        <div className="bg-gradient-to-b from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 sticky top-24">
          {/* Movie Info */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-primary mb-1">
              {show.movie?.title || "Movie"}
            </h2>
            <p className="text-sm text-gray-400">
              {show.theatre?.name || "Theatre"} •{" "}
              {show.screen?.name || `Screen ${show.screen?.screenNumber}`}
            </p>
          </div>

          {/* Screen Type Badge */}
          <div
            className={`mb-6 px-4 py-3 rounded-lg bg-gradient-to-r ${screenBadge.color} border ${screenBadge.border}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{screenBadge.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {getScreenTypeLabel()}
                </p>
                <p className="text-xs text-gray-300">
                  {seatLayout?.totalSeats || 0} seats
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Show Time for {date}
            </p>
            <div className="space-y-2">
              {show.dateTime[date]?.map((item) => (
                <button
                  key={item.time}
                  onClick={() => setSelectedTime(item)}
                  className={`
                    flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      selectedTime?.time === item.time
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                    }
                  `}
                >
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {isoTimeFormat(item.time)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          {selectedSeats.size > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Price Breakdown
              </h3>
              <div className="space-y-2 mb-4">
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
                      <span className="text-gray-400">
                        {tier} × {info.count}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      ₹{info.total}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ₹{totalPrice}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Seat Layout */}
      <div className="flex-1 flex flex-col items-center">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0px" />

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Select Your Seats
          </h1>
          <p className="text-gray-400 text-sm">
            {selectedSeats.size > 0
              ? `${selectedSeats.size} seat${selectedSeats.size > 1 ? "s" : ""} selected`
              : "Click on available seats to select"}
          </p>
        </div>

        {/* Screen */}
        <div className="w-full max-w-2xl mb-8">
          <img
            src={assets.screenImage}
            alt="Screen"
            className="w-full opacity-80"
          />
          <p className="text-gray-500 text-xs text-center mt-1 tracking-widest">
            SCREEN
          </p>
        </div>

        {/* Seat Legend */}
        <div className="w-full max-w-3xl mb-6">
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                Seat Categories
              </h3>
              <button
                onClick={handleRefresh}
                disabled={seatsLoading}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
              >
                <RefreshCw
                  className={`w-3 h-3 ${seatsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Seat Type Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
              {Object.entries(SEAT_TIERS).map(([key, tier]) => {
                // Get actual price from show data
                let actualPrice = tier.basePrice;
                if (show?.seatTiers && Array.isArray(show.seatTiers)) {
                  const matchingTier = show.seatTiers.find(t => t.tierName === tier.name);
                  if (matchingTier && matchingTier.price) {
                    actualPrice = matchingTier.price;
                  }
                }
                
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center text-[8px] font-bold"
                      style={{
                        backgroundColor: `${tier.color}30`,
                        borderColor: tier.color,
                        color: tier.color,
                      }}
                    >
                      {key}
                    </div>
                    <span className="text-xs text-gray-300">{tier.name}</span>
                    <span className="text-xs text-gray-500">
                      ₹{actualPrice}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="flex justify-center gap-6 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2 border-gray-500 bg-gray-500/30" />
                <span className="text-xs text-gray-400">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2 border-primary bg-primary ring-2 ring-white ring-offset-1 ring-offset-gray-900" />
                <span className="text-xs text-gray-400">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md border-2 border-gray-600 bg-gray-700 opacity-50" />
                <span className="text-xs text-gray-400">Booked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Seats Display */}
        {selectedSeats.size > 0 && (
          <div className="w-full max-w-3xl mb-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400 mb-2">
                    Selected Seats ({selectedSeats.size})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeatDetails.map((seat) => (
                      <button
                        key={seat.seatNumber}
                        onClick={() => handleSeatClick(seat.seatNumber)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor: `${seat.color}25`,
                          borderColor: seat.color,
                          color: "#fff",
                        }}
                        title={`Click to deselect ${seat.seatNumber}`}
                      >
                        {seat.seatNumber} • {seat.tierName} • ₹{seat.price}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seat Layout Grid */}
        <div className="w-full overflow-x-auto pb-4">
          {seatsLoading && !seatLayout?.layout ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-gray-400">Loading seat layout...</p>
            </div>
          ) : seatLayout?.layout ? (
            <div className="flex flex-col items-center min-w-max px-4">
              {seatLayout.layout.map((rowData, rowIndex) =>
                renderSeatRow(rowData, rowIndex),
              )}

              {/* Column numbers */}
              <div className="flex items-center justify-center gap-1 md:gap-1.5 mt-3">
                <span className="w-6" />
                {seatLayout.layout[0]?.map((_, colIndex) => (
                  <span
                    key={colIndex}
                    className="w-7 md:w-8 text-center text-[10px] text-gray-500 font-medium"
                  >
                    {colIndex + 1}
                  </span>
                ))}
                <span className="w-6" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-8 h-8 text-yellow-500 mb-4" />
              <p className="text-gray-400">Seat layout not available</p>
              <p className="text-gray-500 text-sm mt-1">
                Please contact support
              </p>
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <div className="mt-8 w-full max-w-md">
          <button
            onClick={bookTickets}
            disabled={
              bookingLoading || selectedSeats.size === 0 || !selectedTime
            }
            className={`
              w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl
              font-semibold text-lg transition-all duration-300
              ${
                selectedSeats.size > 0 && selectedTime
                  ? "bg-primary hover:bg-primary-dull shadow-lg shadow-primary/30 hover:shadow-primary/50"
                  : "bg-gray-700 cursor-not-allowed opacity-50"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98]
            `}
          >
            {bookingLoading ? (
              <>
                <ButtonLoader size={20} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {selectedSeats.size === 0
                    ? "Select Seats to Continue"
                    : `Pay ₹${totalPrice}`}
                </span>
                {selectedSeats.size > 0 && (
                  <ArrowRightIcon strokeWidth={3} className="w-5 h-5" />
                )}
              </>
            )}
          </button>

          {selectedSeats.size > 0 && (
            <p className="text-center text-gray-500 text-xs mt-3">
              {selectedSeats.size} seat{selectedSeats.size > 1 ? "s" : ""} •
              Secure payment via Stripe
            </p>
          )}
        </div>

        {/* Last Refresh Info */}
        <p className="text-gray-600 text-xs mt-6">
          Seat availability auto-refreshes every 30 seconds
          {lastRefresh && (
            <span>
              {" "}
              • Last updated: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SeatLayout;
