import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import ButtonLoader from "../components/ButtonLoader";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { SEAT_TIERS } from "../components/SeatLayoutTemplates.js";

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  const navigate = useNavigate();

  const { id, date } = useParams();

  const { axios, getToken, user } = useAppContext();

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [seatLayout, setSeatLayout] = useState(null);

  const getSeatCodeFromLayout = (seatNumber) => {
    if (!seatLayout?.layout) return null;
    const rowLetter = String(seatNumber || "").charAt(0);
    const colRaw = String(seatNumber || "").slice(1);
    const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65;
    const colIndex = Number.parseInt(colRaw, 10) - 1;
    if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) return null;
    if (rowIndex < 0 || colIndex < 0) return null;
    const row = seatLayout.layout[rowIndex];
    if (!Array.isArray(row)) return null;
    return row[colIndex] || null;
  };

  const getScreenTypeLabel = () => {
    const layout = seatLayout?.layout;
    if (!layout) return "Screen";
    const flat = layout.flat().filter(Boolean);
    const hasRecliner = flat.includes("R");
    const hasCouple = flat.includes("C");
    const hasPremium = flat.includes("P") || flat.includes("D");

    if (hasCouple) return "Couple Screen";
    if (hasRecliner && hasPremium) return "Premium Screen";
    if (hasRecliner) return "Recliner Screen";
    if (hasPremium) return "Classic Screen";
    return "Classic Screen";
  };

  const selectedSeatDetails = selectedSeats
    .map((seatNumber) => {
      const code = getSeatCodeFromLayout(seatNumber);
      const tier = code ? SEAT_TIERS[code] : null;
      return {
        seatNumber,
        code,
        tierName: tier?.name || "Unknown",
        price: tier?.basePrice || 0,
        color: tier?.color || "#94a3b8",
      };
    })
    .sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));

  const totalPrice = selectedSeatDetails.reduce((sum, s) => sum + (s.price || 0), 0);

  const getShow = async () => {
    try {
      // `id` is a showId in the current booking flow
      const { data } = await axios.get(`/api/show/show/${id}`);

      if (!data?.success || !data?.show) {
        return;
      }

      const normalized = {
        movie: data.show.movie,
        theatre: data.show.theatre,
        screen: data.show.screen,
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

      // Auto-select the only timing for this show/date
      setSelectedTime(normalized.dateTime?.[date]?.[0] || null);
    } catch (error) {
      console.error('Error fetching show:', error);
    }
  };

  const handleSeatClick = (seatId) => {
    console.log('Seat clicked:', seatId);
    
    if (!selectedTime) {
      return toast("Please select a time first");
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select up to 5 seats");
    }

    if (occupiedSeats.includes(seatId)) {
      return toast("This seat is already booked");
    }

    // Validate seat format (should be like "A1", "B2", etc.)
    if (!/^[A-Z]\d+$/.test(seatId)) {
      console.error('Invalid seat format:', seatId);
      return toast("Invalid seat format");
    }

    console.log('Adding seat to selection:', seatId);
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const getSeatColor = (seatType) => {
    const tier = SEAT_TIERS[seatType];
    return tier ? tier.color : '#94a3b8'; // Default gray color
  };

  const getSeatName = (seatType) => {
    const tier = SEAT_TIERS[seatType];
    return tier ? tier.name : 'Standard';
  };

  const renderSeat = (seatType, row, col) => {
    const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;
    const isSelected = selectedSeats.includes(seatId);
    const isOccupied = occupiedSeats.includes(seatId);
    const seatColor = getSeatColor(seatType);
    
    if (seatType === '' || seatType === null || seatType === undefined) {
      return <div key={`empty-${row}-${col}`} className="w-7 h-7 md:w-8 md:h-8" />; // Empty space
    }

    return (
      <button
        key={seatId}
        onClick={() => handleSeatClick(seatId)}
        disabled={isOccupied}
        className={`h-7 w-7 md:h-8 md:w-8 rounded border text-xs font-bold transition-all cursor-pointer
          ${isSelected ? "ring-2 ring-white scale-110 z-10" : ""}
          ${isOccupied 
            ? "bg-gray-700 border-gray-600 cursor-not-allowed opacity-50" 
            : `hover:scale-105 hover:z-5`}
        `}
        style={{
          backgroundColor: isSelected ? seatColor : (isOccupied ? '#374151' : seatColor + '40'),
          borderColor: isSelected ? seatColor : (isOccupied ? '#4b5563' : seatColor),
          color: isSelected ? 'white' : (isOccupied ? '#9ca3af' : seatColor)
        }}
        title={`${getSeatName(seatType)} - Seat ${seatId} - ₹${SEAT_TIERS[seatType]?.basePrice || 150}`}
      >
        {seatId}
      </button>
    );
  };

  const renderSeatRow = (rowData, rowIndex) => {
    if (!rowData || !Array.isArray(rowData)) return null;
    
    return (
      <div key={rowIndex} className="flex justify-center gap-1.5 md:gap-2 mb-1.5">
        <span className="w-6 text-right text-xs text-gray-400 font-medium">
          {String.fromCharCode(65 + rowIndex)}
        </span>
        {rowData.map((seatType, colIndex) => renderSeat(seatType, rowIndex, colIndex))}
        <span className="w-6 text-left text-xs text-gray-400 font-medium">
          {String.fromCharCode(65 + rowIndex)}
        </span>
      </div>
    );
  };

  // Fallback renderSeats function for hardcoded layout
  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex justify-center gap-2 mt-2">
      <div className="flex xl:flex-nowrap 2xl:flex-wrap flex-wrap justify-center gap-1.5 md:gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);
          const isOccupied = occupiedSeats.includes(seatId);
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              disabled={isOccupied}
              className={`h-7 w-7 md:h-8 md:w-8 rounded border text-xs font-medium transition-colors cursor-pointer
                ${isSelected ? "bg-primary text-white" : ""}
                ${
                  isOccupied
                    ? "bg-primary-dull opacity-50 cursor-not-allowed"
                    : ""
                }
                ${!isSelected && !isOccupied ? "hover:bg-primary/30" : ""}
              `}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  const fetchOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}`
      );

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const bookTickets = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      if (!selectedTime || !selectedSeats.length) {
        return toast.error("Please select a time and seats");
      }

      setBookingLoading(true);

      const bookingData = {
        showId: selectedTime.showId,
        selectedSeats: selectedSeats.map(seatId => ({ seatNumber: seatId })),
      };
      
      console.log('Booking data being sent:', bookingData);
      console.log('Selected seats:', selectedSeats);

      const { data } = await axios.post(
        "/api/booking/create",
        bookingData,
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        // Provide more specific error messages
        if (data.message.includes("already booked")) {
          toast.error("One or more selected seats are already booked. Please select different seats.");
        } else if (data.message.includes("invalid")) {
          toast.error("Invalid seat selection. Please try again.");
        } else if (data.message.includes("available")) {
          toast.error("Selected seats are no longer available. Please refresh and try again.");
        } else {
          toast.error(data.message || "Booking failed. Please try again.");
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    getShow();
  }, []);

  useEffect(() => {
    if (selectedTime) {
      setSelectedSeats([]);
      fetchOccupiedSeats();
    }
  }, [selectedTime]);

  return show ? (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
      {/* Avaliable Timing */}
      <div className="w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:top-30 ">
        <p className=" text-lg px-6 md:text-left text-center font-semibold">
          Movie:{" "}
          <span className="text-xl text-primary font-bold">
            {show.movie.title}
          </span>
        </p>
        <p className="text-lg font-semibold px-6 text-center md:text-left">
          Available Timings for: <span className=" text-primary">{date}</span>
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2 justify-items-center px-4 md:px-0 md:space-y-1">
          {show.dateTime[date]?.map((item) => (
            <div
              key={item.time}
              onClick={() => setSelectedTime(item)}
              className={`flex items-center justify-center gap-2 w-full md:w-max md:rounded-r-md px-4 py-2 cursor-pointer transition rounded-md
                ${
                  selectedTime?.time === item.time
                    ? "bg-primary text-white"
                    : "hover:bg-primary/20"
                }`}
            >
              <ClockIcon className="w-5 h-5" />
              <p className="text-md">{isoTimeFormat(item.time)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-26">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0px" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
        <img
          src={assets.screenImage}
          alt="Screen"
          className="w-full max-w-md"
        />
        <p className="text-gray-400 text-sm mb-6">SCREEN THIS WAY</p>

        <div className="flex flex-col items-center mt-6 text-xs text-gray-300 w-full px-2">
          {/* Enhanced Seat Category Legend */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-center text-white">Seat Categories</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(SEAT_TIERS).map(([key, tier]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border-2"
                    style={{ backgroundColor: tier.color + '60', borderColor: tier.color }}
                  />
                  <span className="text-xs text-gray-300 font-medium">{tier.name}</span>
                  <span className="text-xs text-gray-400">₹{tier.basePrice}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border border-gray-500 bg-gray-700" />
                  <span className="text-gray-400">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border border-gray-500 bg-gray-600" />
                  <span className="text-gray-400">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded border border-gray-500 bg-gray-800" />
                  <span className="text-gray-400">Occupied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Screen Category Display */}
          {show?.screen && (
            <div className="mb-4 text-center">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 text-sm rounded-full border border-blue-500/30 font-medium">
                🎬 {show.screen.name || `Screen ${show.screen.screenNumber}`} • {getScreenTypeLabel()}
              </span>
              <div className="mt-2 text-xs text-gray-400">
                {seatLayout?.totalSeats || show.screen?.seatLayout?.totalSeats || 0} Seats Available
              </div>
            </div>
          )}

          {/* Selected seats + price breakdown */}
          <div className="w-full max-w-3xl mb-6">
            <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-300 font-semibold">Selected Seats</p>
                  <p className="text-xs text-gray-400">Tap seats to add/remove. Locked/occupied seats are disabled.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300 font-semibold">Total</p>
                  <p className="text-lg font-bold text-white">₹{totalPrice}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSeatDetails.length === 0 ? (
                  <span className="text-xs text-gray-500">No seats selected</span>
                ) : (
                  selectedSeatDetails.map((s) => (
                    <span
                      key={s.seatNumber}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition"
                      style={{
                        borderColor: s.color,
                        backgroundColor: `${s.color}25`,
                        color: "#fff",
                      }}
                      title={`${s.tierName} • ₹${s.price}`}
                    >
                      {s.seatNumber} • {s.tierName}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Seat Layout */}
          {seatLayout?.layout ? (
            <div className="flex flex-col items-center space-y-1">
              {seatLayout.layout.map((rowData, rowIndex) => renderSeatRow(rowData, rowIndex))}
            </div>
          ) : (
            // Fallback to hardcoded layout if no data available
            <div className="flex flex-col items-center mt-6 text-xs text-gray-300 w-full px-2">
              <div className="text-center mb-4 text-yellow-400">
                ⚠️ Using default layout - Screen data not available
              </div>
              <div className="flex flex-col items-center mb-4 md:mb-6">
                {groupRows[0].map((row) => renderSeats(row))}
              </div>

              <div className="flex flex-col md:flex-row items-start w-full justify-center gap-4 md:gap-12 mb-4 md:mb-6">
                <div className="flex flex-col items-center w-full md:w-auto">
                  {groupRows[1].map((row) => renderSeats(row))}
                </div>
                <div className="flex flex-col items-center w-full md:w-auto">
                  {groupRows[2].map((row) => renderSeats(row))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start w-full justify-center gap-4 md:gap-12">
                <div className="flex flex-col items-center w-full md:w-auto">
                  {groupRows[3].map((row) => renderSeats(row))}
                </div>
                <div className="flex flex-col items-center w-full md:w-auto">
                  {groupRows[4].map((row) => renderSeats(row))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={bookTickets}
          disabled={bookingLoading}
          className="flex items-center gap-2 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull 
    transition rounded-full font-medium cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {bookingLoading ? (
            <ButtonLoader size={18} />
          ) : (
            <>
              Proceed to Checkout
              <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
