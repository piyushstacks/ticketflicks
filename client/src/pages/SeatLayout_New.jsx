import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loading from "../components/Loading";
import ButtonLoader from "../components/ButtonLoader";
import { ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import BlurCircle from "../components/BlurCircle";
import { SEAT_TIERS } from "../components/SeatLayoutTemplates.js";

const SeatLayout = () => {
  const navigate = useNavigate();
  const { showId } = useParams();

  const { axios, getToken, user } = useAppContext();

  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [seatTiers, setSeatTiers] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch show details with seat tiers
  const getShowDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/show/${showId}`);
      if (data.success) {
        setShow(data.show);
        setSeatTiers(data.show.seatTiers);
        console.log("Show fetched:", data.show);
      } else {
        toast.error("Failed to load show details");
      }
    } catch (error) {
      console.error("Error fetching show:", error);
      toast.error("Error loading show");
    } finally {
      setLoading(false);
    }
  };

  // Fetch occupied seats
  const fetchOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
        console.log("Occupied seats:", data.occupiedSeats);
      }
    } catch (error) {
      console.error("Error fetching occupied seats:", error);
    }
  };

  const getSeatCodeFromLayout = (seatNumber) => {
    const layout = show?.screen?.seatLayout?.layout;
    if (!Array.isArray(layout)) return null;

    const rowLetter = String(seatNumber || "").charAt(0);
    const colRaw = String(seatNumber || "").slice(1);
    const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65;
    const colIndex = Number.parseInt(colRaw, 10) - 1;
    if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) return null;
    if (rowIndex < 0 || colIndex < 0) return null;
    const row = layout[rowIndex];
    if (!Array.isArray(row)) return null;
    return row[colIndex] || null;
  };

  const getSeatTierInfo = (seatNumber) => {
    const code = getSeatCodeFromLayout(seatNumber);
    if (!code) return null;
    const tier = SEAT_TIERS[code];
    if (!tier) return null;
    return { tierName: tier.name, price: tier.basePrice, color: tier.color };
  };

  // Handle seat click
  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) {
      return toast.error("This seat is already booked");
    }

    const tierInfo = getSeatTierInfo(seatId);
    if (!tierInfo) {
      return; // aisle/empty seat cell
    }

    const seatWithTier = { seatNumber: seatId, tierName: tierInfo.tierName };

    setSelectedSeats((prev) => {
      const isAlreadySelected = prev.some((s) => s.seatNumber === seatId);

      if (isAlreadySelected) {
        return prev.filter((s) => s.seatNumber !== seatId);
      }

      if (prev.length >= 5) {
        toast.error("You can select maximum 5 seats");
        return prev;
      }

      return [...prev, seatWithTier];
    });
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => {
      const tierInfo = getSeatTierInfo(seat.seatNumber);
      return total + (tierInfo?.price || 0);
    }, 0);
  };

  // Get tier color for UI
  const getTierColor = (tierName) => {
    const colors = {
      Standard: "bg-slate-500",
      Deluxe: "bg-blue-500",
      Premium: "bg-violet-500",
      Recliner: "bg-red-500",
      Couple: "bg-pink-500",
    };
    return colors[tierName] || "bg-gray-500";
  };

  // Get tier text color
  const getTierTextColor = (tierName) => {
    const colors = {
      Standard: "text-white",
      Deluxe: "text-white",
      Premium: "text-white",
      Recliner: "text-white",
      Couple: "text-white",
    };
    return colors[tierName] || "text-white";
  };

  // Render seats grid from 2D seatLayout (supports aisles)
  const renderSeats = () => {
    if (!show) return null;

    const matrix = show.screen?.seatLayout?.layout;
    if (!Array.isArray(matrix) || matrix.length === 0) return null;

    return (
      <div className="space-y-3">
        {matrix.map((rowArr, rowIndex) => {
          const rowLetter = String.fromCharCode(65 + rowIndex);
          return (
            <div key={rowLetter} className="flex justify-center gap-1.5">
              <div className="w-6 text-center text-xs font-bold text-gray-400">{rowLetter}</div>
              <div className="flex gap-1.5">
                {rowArr.map((code, colIndex) => {
                  if (!code) {
                    return <div key={`gap-${rowLetter}-${colIndex}`} className="h-8 w-8" />;
                  }
                  const seatId = `${rowLetter}${colIndex + 1}`;
                  const tierInfo = getSeatTierInfo(seatId);
                  const isSelected = selectedSeats.some((s) => s.seatNumber === seatId);
                  const isOccupied = occupiedSeats.includes(seatId);

                  return (
                    <button
                      key={seatId}
                      onClick={() => handleSeatClick(seatId)}
                      disabled={isOccupied}
                      className={
                        `h-8 w-8 text-xs rounded font-semibold transition-all duration-200 cursor-pointer ` +
                        `flex items-center justify-center ` +
                        (isOccupied
                          ? "bg-gray-500 cursor-not-allowed opacity-40"
                          : isSelected
                          ? `${getTierColor(tierInfo?.tierName)} border-2 border-white scale-110 ${getTierTextColor(tierInfo?.tierName)}`
                          : `${getTierColor(tierInfo?.tierName)} ${getTierTextColor(tierInfo?.tierName)} hover:scale-105 active:scale-95`)
                      }
                      title={`${seatId} - ${tierInfo?.tierName} (₹${tierInfo?.price})`}
                    >
                      {seatId}
                    </button>
                  );
                })}
              </div>
              <div className="w-6 text-center text-xs font-bold text-gray-400">{rowLetter}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Create booking
  const handleBooking = async () => {
    try {
      if (!user) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      if (selectedSeats.length === 0) {
        return toast.error("Please select at least one seat");
      }

      setBookingLoading(true);

      const token = await getToken();
      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId: showId,
          selectedSeats: selectedSeats,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success("Redirecting to payment...");
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.response?.data?.message || "Error creating booking");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    getShowDetails();
    fetchOccupiedSeats();

    // Refresh occupied seats every 10 seconds
    const interval = setInterval(fetchOccupiedSeats, 10000);
    return () => clearInterval(interval);
  }, [showId]);

  if (loading) return <Loading />;
  if (!show)
    return (
      <div className="text-center p-8 text-red-500">Show not found</div>
    );

  const totalPrice = calculateTotalPrice();

  const seatMatrix = show.screen?.seatLayout?.layout || [];
  const availableSeatCodes = Array.from(
    new Set((Array.isArray(seatMatrix) ? seatMatrix : []).flat().filter(Boolean))
  );
  const availableCategories = availableSeatCodes
    .map((code) => ({ code, ...(SEAT_TIERS[code] || {}) }))
    .filter((x) => x.name)
    .sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));

  const screenTypeLabel = (() => {
    const flat = (Array.isArray(seatMatrix) ? seatMatrix : []).flat().filter(Boolean);
    const hasRecliner = flat.includes("R");
    const hasCouple = flat.includes("C");
    const hasPremium = flat.includes("P") || flat.includes("D");
    if (hasCouple) return "Couple Screen";
    if (hasRecliner && hasPremium) return "Premium Screen";
    if (hasRecliner) return "Recliner Screen";
    if (hasPremium) return "Classic Screen";
    return "Classic Screen";
  })();

  return (
    <div className="relative px-6 md:px-16 lg:px-40 pt-20 pb-20 overflow-hidden min-h-screen">
      <BlurCircle top="50px" left="0" />
      <BlurCircle bottom="100px" right="100px" />

      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary hover:text-primary-dull transition mb-8"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Show Info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {show.movie.title}
          </h1>
          <div className="flex flex-col md:flex-row justify-center gap-4 text-gray-400">
            <p className="font-semibold">{(show.theatre || show.theater)?.name}</p>
            <p className="font-semibold">{show.screen?.screenNumber}</p>
            <p>
              {new Date(show.showDateTime).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Tier Legend */}
        <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-6 mb-8 border border-gray-700">
          <p className="text-sm text-gray-400 mb-4">Seat Categories:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {availableCategories.map((tier) => (
              <div
                key={tier.code}
                className={`flex items-center gap-3 p-3 rounded-lg bg-gray-800/50`}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: tier.color || "#94a3b8" }}
                ></div>
                <span className="text-sm">
                  <span className="font-semibold">{tier.name}</span> - ₹{tier.basePrice}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seats Layout */}
        <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-8 mb-8 border border-gray-700">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm">📺 SCREEN</p>
          </div>

          {renderSeats()}

          <div className="text-center mt-6 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              ⬜ Available | ⬜ Your Selection | ⬜ Booked
            </p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-900/30 backdrop-blur-md rounded-lg p-8 border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Booking Summary</h2>

          {selectedSeats.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-primary">
                  Selected Seats ({selectedSeats.length}):
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                  {selectedSeats.map((seat) => {
                    const tierInfo = getSeatTierInfo(seat.seatNumber);
                    return (
                      <div
                        key={seat.seatNumber}
                        className={`
                          p-3 rounded-lg text-center text-sm font-semibold
                          ${getTierColor(seat.tierName)} ${getTierTextColor(seat.tierName)}
                          flex flex-col items-center gap-1
                        `}
                      >
                        <span>{seat.seatNumber}</span>
                        <span className="text-xs opacity-80">
                          ₹{tierInfo?.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-t border-gray-700 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Convenience Fee:</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-3">
                  <span>Total:</span>
                  <span className="text-primary">₹{totalPrice}</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
                  flex items-center justify-center gap-2
                  ${
                    bookingLoading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-dull active:scale-95"
                  }
                `}
              >
                {bookingLoading ? (
                  <>
                    <ButtonLoader />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg mb-4">
                👈 Select seats to proceed
              </p>
              <p className="text-gray-500 text-sm">
                You can select up to 5 seats
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;
