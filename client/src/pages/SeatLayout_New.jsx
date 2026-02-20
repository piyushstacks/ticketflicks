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

  // Build tier pricing map from show/screen data
  const tierPricingMap = useMemo(() => {
    const map = {};

    // First, try to get prices from show's seatTiers
    if (show?.seatTiers && Array.isArray(show.seatTiers)) {
      show.seatTiers.forEach((tier) => {
        // Map tierName back to code
        const nameToCode = {
          Standard: "S",
          Deluxe: "D",
          Premium: "P",
          Recliner: "R",
          Couple: "C",
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

    // Then try screen's seatTiers if show doesn't have pricing
    if (
      Object.keys(map).length === 0 &&
      show?.screen?.seatTiers &&
      Array.isArray(show.screen.seatTiers)
    ) {
      show.screen.seatTiers.forEach((tier) => {
        const nameToCode = {
          Standard: "S",
          Deluxe: "D",
          Premium: "P",
          Recliner: "R",
          Couple: "C",
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

    // Try embedded theatre.screens pricing as fallback
    if (
      Object.keys(map).length === 0 &&
      show?.theatre?.screens &&
      Array.isArray(show.theatre.screens)
    ) {
      const screenId = show.screen?._id?.toString();
      const screenNumber = show.screen?.screenNumber;
      const screenName = show.screen?.name;

      const embeddedScreen = show.theatre.screens.find((s) => {
        return (
          s._id?.toString() === screenId ||
          s.screenNumber === screenNumber ||
          s.name === screenName
        );
      });

      if (embeddedScreen?.pricing) {
        const pricing = embeddedScreen.pricing;

        // Handle unified pricing
        if (pricing.unified !== undefined) {
          const price = parseFloat(pricing.unified) || 150;
          // Apply to all seat types in layout
          if (embeddedScreen.layout?.layout) {
            const codesInLayout = new Set();
            embeddedScreen.layout.layout.flat().forEach((code) => {
              if (code && code !== "") codesInLayout.add(code);
            });

            codesInLayout.forEach((code) => {
              const tier = SEAT_TIERS[code];
              if (tier) {
                map[code] = {
                  name: tier.name,
                  price: price,
                  color: tier.color,
                };
              }
            });
          }
        } else {
          // Handle tier-based pricing
          Object.entries(pricing).forEach(([code, config]) => {
            const tier = SEAT_TIERS[code];
            if (tier && config) {
              map[code] = {
                name: tier.name,
                price: parseFloat(config.price || config) || tier.basePrice,
                color: tier.color,
              };
            }
          });
        }
      }
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
  }, [show]);

  // Get seat layout from screen (with fallback to embedded theatre.screens)
  const seatLayout = useMemo(() => {
    const screenLayout = show?.screen?.seatLayout;

    // Check if layout exists and has data
    if (
      screenLayout &&
      screenLayout.layout &&
      Array.isArray(screenLayout.layout) &&
      screenLayout.layout.length > 0
    ) {
      return screenLayout;
    }

    // Fallback: Try to find screen in embedded theatre.screens array
    if (show?.theatre?.screens && Array.isArray(show.theatre.screens)) {
      const screenId = show.screen?._id?.toString();
      const screenNumber = show.screen?.screenNumber;
      const screenName = show.screen?.name;

      // Try to find matching screen by ID, number, or name
      const embeddedScreen = show.theatre.screens.find((s) => {
        return (
          s._id?.toString() === screenId ||
          s.screenNumber === screenNumber ||
          s.name === screenName
        );
      });

      if (embeddedScreen?.layout) {
        // Return the embedded screen's layout
        return embeddedScreen.layout;
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
        console.log("Show loaded:", data.show);
        console.log("Screen seatTiers:", data.show.screen?.seatTiers);
        console.log("Show seatTiers:", data.show.seatTiers);
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
                ? "ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-110 z-10 shadow-lg"
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
          <span className="w-5 text-right text-xs text-gray-500 font-semibold">
            {rowLetter}
          </span>
          <div className="flex gap-1 md:gap-1.5">
            {rowData.map((code, colIndex) =>
              renderSeat(code, rowIndex, colIndex),
            )}
          </div>
          <span className="w-5 text-left text-xs text-gray-500 font-semibold">
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
      console.log("Booking request token:", token);
      console.log("Booking request seatsWithTier:", seatsWithTier);
      console.log("Booking request showId:", showId);
      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId,
          selectedSeats: seatsWithTier,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data.success && data.url) {
        toast.success("Redirecting to payment...");
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Booking failed");
        if (data.message?.toLowerCase().includes("not available")) {
          fetchOccupiedSeats();
        }
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
        <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
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

  // No show
  if (!show) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Show Not Found</h2>
        <p className="text-gray-400 text-center mb-6">
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
    <div className="relative min-h-screen px-4 md:px-8 lg:px-16 xl:px-32 pt-20 pb-16 overflow-hidden">
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {show.movie?.title || "Movie"}
          </h1>
          <div className="flex flex-wrap justify-center gap-3 text-gray-400 text-sm md:text-base">
            <span className="px-3 py-1 bg-gray-800 rounded-full">
              {show.theatre?.name || "Theatre"}
            </span>
            <span className="px-3 py-1 bg-gray-800 rounded-full">
              {show.screen?.name || `Screen ${show.screen?.screenNumber}`}
            </span>
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full font-medium">
              {screenTypeLabel}
            </span>
            <span className="px-3 py-1 bg-gray-800 rounded-full">
              {new Date(show.showDateTime).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        {/* Seat Categories Legend */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-5 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400" />
              Seat Categories & Pricing
            </h3>
            <button
              onClick={handleRefresh}
              disabled={seatsLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 bg-gray-800 rounded-lg"
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
                  <span className="text-gray-300 font-medium">{tier.name}</span>
                  <span className="text-primary ml-2 font-semibold">
                    ₹{tier.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-gray-500 bg-gray-500/30" />
              <span className="text-xs text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-primary bg-primary shadow-lg shadow-primary/30" />
              <span className="text-xs text-gray-400">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border-2 border-gray-600 bg-gray-700 opacity-50" />
              <span className="text-xs text-gray-400">Booked</span>
            </div>
          </div>
        </div>

        {/* Screen */}
        <div className="text-center mb-6">
          <div className="w-3/4 max-w-md mx-auto h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-2" />
          <p className="text-gray-500 text-xs tracking-widest">SCREEN</p>
        </div>

        {/* Seat Layout */}
        <div className="bg-gray-900/30 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-700 overflow-x-auto">
          {seatLayout?.layout && Array.isArray(seatLayout.layout) ? (
            <div className="flex flex-col items-center min-w-max">
              {seatLayout.layout.map((rowData, rowIndex) =>
                renderSeatRow(rowData, rowIndex),
              )}

              {/* Column numbers */}
              <div className="flex items-center justify-center gap-1 md:gap-1.5 mt-4 pt-3 border-t border-gray-700">
                <span className="w-5" />
                {seatLayout.layout[0]?.map((_, colIndex) => (
                  <span
                    key={colIndex}
                    className="w-8 md:w-9 text-center text-[10px] text-gray-500"
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
              <p className="text-gray-400">Seat layout not available</p>
            </div>
          )}
        </div>

        {/* Selected Seats Summary */}
        {selectedSeats.size > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5 mb-6">
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
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">Booking Summary</h2>

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

              <div className="flex justify-between items-center py-4 border-t border-gray-700 mb-6">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{totalPrice}
                </span>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className={`
                  w-full py-4 px-6 rounded-xl font-bold text-white text-lg
                  transition-all duration-200 flex items-center justify-center gap-3
                  ${
                    bookingLoading
                      ? "bg-gray-600 cursor-not-allowed opacity-50"
                      : "bg-primary hover:bg-primary-dull active:scale-[0.98] shadow-lg shadow-primary/30"
                  }
                `}
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

              <p className="text-center text-gray-500 text-xs mt-4">
                {selectedSeats.size} seat{selectedSeats.size > 1 ? "s" : ""} •
                Secure payment via Stripe
              </p>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No seats selected</p>
              <p className="text-gray-500 text-sm">
                Select seats from the layout above to continue
              </p>
              <p className="text-gray-600 text-xs mt-3">
                Maximum {MAX_SEATS} seats allowed
              </p>
            </div>
          )}
        </div>

        {/* Last refresh info */}
        {lastRefresh && (
          <p className="text-center text-gray-600 text-xs mt-4">
            Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes
            every 30s
          </p>
        )}
      </div>
    </div>
  );
};

export default SeatLayout;
