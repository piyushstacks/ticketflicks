import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets, dummyShowsData, dummyOccupiedSeats } from "../assets/assets";
import Loading from "../components/Loading";
import ButtonLoader from "../components/ButtonLoader";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

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
  const [show, setShow] = useState(() => {
    // Initialize with dummy data immediately
    const dummyShow = dummyShowsData.find((show) => show._id === id);
    return dummyShow || dummyShowsData[0];
  });
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);

      if (data.success && data.movie) {
        console.log("Loaded show from API:", data.movie);
        setShow(data.movie);
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.log("Error fetching show, using dummy data:", error.message);
      // Fallback to dummy data
      const dummyShow = dummyShowsData.find((show) => show._id === id);
      const showToSet = dummyShow || dummyShowsData[0];
      console.log("Setting dummy show:", showToSet);
      setShow(showToSet);
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select a time first");
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select up to 5 seats");
    }

    if (occupiedSeats.includes(seatId)) {
      return toast("This seat is already booked");
    }

    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex justify-between gap-2 mt-2">
      <div className="flex xl:flex-nowrap 2xl:flex-wrap flex-wrap justify-center gap-1.5 md:gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);
          const isOccupied = occupiedSeats.includes(seatId);
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`h-7 w-7 md:h-8 md:w-8 rounded border border-primary/60 text-xs transition-colors cursor-pointer
                ${isSelected ? "bg-primary text-white" : ""}
                ${
                  isOccupied
                    ? "bg-primary-dull opacity-50"
                    : " hover:bg-primary/20"
                }
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
        // Handle both object and array formats
        let seatsArray = [];
        if (Array.isArray(data.occupiedSeats)) {
          seatsArray = data.occupiedSeats;
        } else if (typeof data.occupiedSeats === "object" && data.occupiedSeats !== null) {
          // Convert object keys to array (e.g., { "A1": "userId" } -> ["A1"])
          seatsArray = Object.keys(data.occupiedSeats);
        }
        setOccupiedSeats(seatsArray);
      } else {
        console.log("Could not fetch occupied seats, using dummy data");
        const dummySeats = dummyOccupiedSeats[selectedTime.showId] || [];
        setOccupiedSeats(dummySeats);
      }
    } catch (error) {
      console.log("Error fetching occupied seats, using dummy data:", error.message);
      // For dummy data, use pre-defined occupied seats for this show
      const dummySeats = dummyOccupiedSeats[selectedTime.showId] || [];
      console.log("Using dummy occupied seats:", dummySeats);
      setOccupiedSeats(dummySeats);
    }
  };

  const bookTickets = async () => {
    try {
      if (!selectedTime || !selectedSeats.length) {
        return toast.error("Please select a time and seats");
      }

      console.log("Selected seats:", selectedSeats);
      console.log("Occupied seats:", occupiedSeats);

      // Validate that selected seats are still available
      const unavailableSeats = selectedSeats.filter((seat) =>
        occupiedSeats.includes(seat)
      );
      
      console.log("Unavailable seats:", unavailableSeats);

      if (unavailableSeats.length > 0) {
        toast.error(`Seats ${unavailableSeats.join(", ")} are no longer available`);
        return;
      }

      setBookingLoading(true);

      // For now, always use dummy booking since backend is not fully configured
      // This provides a complete demo experience
      console.log("Using dummy booking for demo");
      setTimeout(() => {
        navigateWithDummyBooking();
      }, 1000); // Small delay for UX
    } catch (error) {
      toast.error(error.message || "Booking failed");
      setBookingLoading(false);
    }
  };

  const navigateWithDummyBooking = () => {
    // Save the booking info to localStorage for the MyBookings page to display
    const bookingInfo = {
      show: show,
      selectedTime: selectedTime,
      selectedSeats: selectedSeats,
      bookingDate: new Date().toISOString(),
      bookingId: `DUMMY-${Date.now()}`,
      isPaid: true,
      amount: selectedSeats.length * 100, // Dummy price calculation
    };
    localStorage.setItem("currentBooking", JSON.stringify(bookingInfo));
    toast.success("Booking confirmed!");
    navigate("/my-bookings");
  };

  useEffect(() => {
    if (id) {
      getShow();
    }
  }, [id]);

  useEffect(() => {
    // Auto-select first available time if show data is loaded and no time is selected
    if (show && show.dateTime && date) {
      let availableTimes = show.dateTime[date];
      
      // Fallback: if the exact date is not found, create default times
      if (!availableTimes || availableTimes.length === 0) {
        availableTimes = [
          { "time": `${date}T01:00:00.000Z`, "showId": "default-1" },
          { "time": `${date}T03:00:00.000Z`, "showId": "default-2" },
          { "time": `${date}T05:00:00.000Z`, "showId": "default-3" }
        ];
        console.warn("Using default times for date:", date);
      }
      
      if (!selectedTime && availableTimes && availableTimes.length > 0) {
        setSelectedTime(availableTimes[0]);
      }
    }
  }, [show, date]);

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
            {show.movie?.title || show.title}
          </span>
        </p>
        <p className="text-lg font-semibold px-6 text-center md:text-left">
          Available Timings for: <span className=" text-primary">{date}</span>
        </p>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2 justify-items-center px-4 md:px-0 md:space-y-1">
          {(show.dateTime && show.dateTime[date] && show.dateTime[date].length > 0) ? (
            show.dateTime[date].map((item) => (
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
            ))
          ) : (
            <p className="text-gray-400 text-sm">No times available for this date</p>
          )}
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
