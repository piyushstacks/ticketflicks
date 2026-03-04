# Frontend Integration Guide - Theater Management System

## Overview
This guide helps integrate the new theater management system with your React frontend. It covers component updates needed to support multiple theaters, screens, and seat tiers.

---

## 1. Component Changes Required

### 1.1 SeatLayout.jsx - MAJOR UPDATE

The seat layout needs to display seats organized by tier with pricing.

```jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SeatLayout = () => {
  const navigate = useNavigate();
  const { showId } = useParams();
  
  const { axios, getToken, user } = useAppContext();
  
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch show details with seat tiers
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/show/${showId}`);
      if (data.success) {
        setShow(data.show);
      }
    } catch (error) {
      console.error("Error fetching show:", error);
      toast.error("Failed to load show details");
    }
  };

  // Fetch occupied seats
  const fetchOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      }
    } catch (error) {
      console.error("Error fetching occupied seats:", error);
    }
  };

  // Get tier info for a seat
  const getSeatTierInfo = (seatNumber) => {
    if (!show) return null;
    
    const row = seatNumber.charAt(0);
    for (const tier of show.seatTiers) {
      if (tier.rows.includes(row)) {
        return {
          tierName: tier.tierName,
          price: tier.price,
        };
      }
    }
    return null;
  };

  // Handle seat click
  const handleSeatClick = (seatId) => {
    if (occupiedSeats.includes(seatId)) {
      return toast.error("This seat is already booked");
    }

    const tierInfo = getSeatTierInfo(seatId);
    if (!tierInfo) return;

    const seatWithTier = { seatNumber: seatId, tierName: tierInfo.tierName };

    setSelectedSeats((prev) => {
      const isAlreadySelected = prev.some((s) => s.seatNumber === seatId);
      
      if (isAlreadySelected) {
        return prev.filter((s) => s.seatNumber !== seatId);
      }

      if (prev.length >= 5) {
        return toast.error("You can select maximum 5 seats"), prev;
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
      Standard: "bg-blue-400",
      Premium: "bg-yellow-400",
      VIP: "bg-red-400",
    };
    return colors[tierName] || "bg-gray-400";
  };

  // Render seats by tier
  const renderSeats = () => {
    if (!show) return null;

    const rows = Array.from({ length: show.screen.seatLayout.rows }, (_, i) =>
      String.fromCharCode(65 + i)
    );

    return (
      <div className="space-y-4">
        {/* Tier Legend */}
        <div className="flex gap-6 justify-center mb-6 flex-wrap">
          {show.seatTiers.map((tier) => (
            <div key={tier.tierName} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getTierColor(tier.tierName)}`}></div>
              <span className="text-sm">
                {tier.tierName} (₹{tier.price})
              </span>
            </div>
          ))}
        </div>

        {/* Screen */}
        <div className="text-center mb-4 font-bold text-gray-600">
          📺 SCREEN
        </div>

        {/* Seats */}
        {rows.map((row) => (
          <div key={row} className="flex justify-center gap-1.5">
            <div className="w-6 text-center text-xs font-bold">{row}</div>
            <div className="flex gap-1.5">
              {Array.from(
                { length: show.screen.seatLayout.seatsPerRow },
                (_, i) => {
                  const seatId = `${row}${i + 1}`;
                  const tierInfo = getSeatTierInfo(seatId);
                  const isSelected = selectedSeats.some(
                    (s) => s.seatNumber === seatId
                  );
                  const isOccupied = occupiedSeats.includes(seatId);

                  return (
                    <button
                      key={seatId}
                      onClick={() => handleSeatClick(seatId)}
                      className={`
                        h-7 w-7 text-xs rounded border transition-all cursor-pointer
                        ${
                          isOccupied
                            ? "bg-gray-400 cursor-not-allowed opacity-50"
                            : isSelected
                            ? `${getTierColor(tierInfo?.tierName)} border-2 border-gray-800 font-bold`
                            : `${getTierColor(tierInfo?.tierName)} hover:opacity-80 border-gray-600`
                        }
                      `}
                      disabled={isOccupied}
                      title={`${seatId} - ${tierInfo?.tierName} (₹${tierInfo?.price})`}
                    >
                      {seatId}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Create booking
  const handleBooking = async () => {
    try {
      if (!user) {
        return navigate("/login");
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
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Booking failed");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Error creating booking");
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    getShow();
    fetchOccupiedSeats();
    
    // Refresh occupied seats every 10 seconds
    const interval = setInterval(fetchOccupiedSeats, 10000);
    return () => clearInterval(interval);
  }, [showId]);

  if (!show) return <div className="text-center p-8">Loading...</div>;

  const totalPrice = calculateTotalPrice();

  return (
    <div className="p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Show Info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{show.movie.title}</h1>
          <p className="text-gray-600">
            {show.theater.name} | {show.screen.screenNumber}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(show.showDateTime).toLocaleString()}
          </p>
        </div>

        {/* Seats */}
        <div className="bg-gray-100 p-6 rounded-lg mb-8">
          {renderSeats()}
        </div>

        {/* Summary */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
          
          {selectedSeats.length > 0 ? (
            <>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Selected Seats:</h3>
                <div className="space-y-1">
                  {selectedSeats.map((seat) => {
                    const tierInfo = getSeatTierInfo(seat.seatNumber);
                    return (
                      <div
                        key={seat.seatNumber}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {seat.seatNumber} ({seat.tierName})
                        </span>
                        <span>₹{tierInfo?.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No seats selected</p>
          )}
        </div>

        {/* Booking Button */}
        <button
          onClick={handleBooking}
          disabled={bookingLoading || selectedSeats.length === 0}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-white transition
            ${
              bookingLoading || selectedSeats.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            }
          `}
        >
          {bookingLoading ? "Processing..." : `Proceed to Payment (₹${totalPrice})`}
        </button>
      </div>
    </div>
  );
};

export default SeatLayout;
```

---

### 1.2 MovieDetails.jsx - ADD THEATER/SCREEN SELECTION

Update the MovieDetails page to select theater and screen before date/time.

```jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axios, imageBaseURL } = useAppContext();

  const [show, setShow] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [shows, setShows] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch all theaters
  const fetchTheaters = async () => {
    try {
      const { data } = await axios.get("/api/theater/");
      if (data.success) {
        setTheaters(data.theaters);
      }
    } catch (error) {
      console.error("Error fetching theaters:", error);
      toast.error("Failed to load theaters");
    }
  };

  // Fetch screens for selected theater
  const fetchScreens = async (theaterId) => {
    if (!theaterId) {
      setScreens([]);
      return;
    }

    try {
      const { data } = await axios.get(`/api/theater/${theaterId}/screens`);
      if (data.success) {
        setScreens(data.screens);
        setSelectedScreen(null);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
    }
  };

  // Fetch shows for movie (grouped by theater/screen)
  const fetchShows = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/by-movie/${id}`);
      if (data.success) {
        setShows(data.groupedShows);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
      toast.error("Failed to load shows");
    } finally {
      setLoading(false);
    }
  };

  // Fetch movie details
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.error("Error fetching show:", error);
    }
  };

  useEffect(() => {
    getShow();
    fetchTheaters();
    fetchShows();
  }, [id]);

  useEffect(() => {
    if (selectedTheater) {
      fetchScreens(selectedTheater);
    }
  }, [selectedTheater]);

  // Get shows for selected theater and screen
  const getShowsForSelection = () => {
    if (!selectedTheater || !selectedScreen || !shows[selectedTheater]) {
      return [];
    }

    const theaterShows = shows[selectedTheater].screens[selectedScreen];
    return theaterShows?.shows || [];
  };

  const selectedShowsData = getShowsForSelection();

  if (!show) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-20 md:pt-30 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Movie Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <img
            src={imageBaseURL + show.movie.poster_path}
            alt="Movie Poster"
            className="rounded-xl h-104 max-w-70 object-cover"
          />
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{show.movie.title}</h1>
            <p className="text-gray-400 mb-4">{show.movie.overview}</p>
            
            {/* Movie Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-xl font-bold">{show.movie.vote_average}/10</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Runtime</p>
                <p className="text-xl font-bold">{show.movie.runtime} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Theater/Screen/Show Selection */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Select Show</h2>

          {/* Theater Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Select Theater
            </label>
            <select
              value={selectedTheater || ""}
              onChange={(e) => setSelectedTheater(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-primary outline-none"
            >
              <option value="">-- Choose a theater --</option>
              {theaters.map((theater) => (
                <option key={theater._id} value={theater._id}>
                  {theater.name} - {theater.city}
                </option>
              ))}
            </select>
          </div>

          {/* Screen Selection */}
          {selectedTheater && screens.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Select Screen
              </label>
              <select
                value={selectedScreen || ""}
                onChange={(e) => setSelectedScreen(e.target.value)}
                className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-primary outline-none"
              >
                <option value="">-- Choose a screen --</option>
                {screens.map((screen) => (
                  <option key={screen._id} value={screen._id}>
                    {screen.screenNumber} ({screen.seatLayout.totalSeats} seats)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Shows Grid */}
          {selectedShowsData.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-4">
                Select Show Time
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedShowsData.map((showItem) => (
                  <button
                    key={showItem._id}
                    onClick={() => navigate(`/seat-layout/${showItem._id}`)}
                    className="p-3 bg-primary hover:bg-primary-dark rounded transition text-center font-semibold"
                  >
                    {new Date(showItem.showDateTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTheater && selectedScreen && selectedShowsData.length === 0 && (
            <p className="text-gray-400 text-center py-4">
              No shows available for this selection
            </p>
          )}

          {!selectedTheater && (
            <p className="text-gray-400 text-center py-4">
              Please select a theater to view available shows
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
```

---

### 1.3 MyBookings.jsx - SHOW THEATER/SCREEN INFO

Update the MyBookings component to display theater, screen, and seat details.

```jsx
import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const MyBookings = () => {
  const { axios, getToken, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/booking/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
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
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-20 pb-20">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No bookings yet</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-gray-900 rounded-lg p-6 border border-gray-700"
            >
              {/* Movie & Theater Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Movie</p>
                  <p className="text-lg font-bold">{booking.show.movie.title}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Theater</p>
                  <p className="text-lg font-bold">{booking.theater.name}</p>
                  <p className="text-sm text-gray-500">{booking.theater.address}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Screen & Time</p>
                  <p className="text-lg font-bold">{booking.screen.screenNumber}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(booking.show.showDateTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Booked Seats */}
              <div className="mb-6 pb-6 border-b border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Booked Seats</p>
                <div className="flex flex-wrap gap-2">
                  {booking.bookedSeats.map((seat, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-primary rounded text-sm font-semibold"
                    >
                      {seat.seatNumber}
                      <span className="text-xs ml-1">
                        ({seat.tierName} - ₹{seat.price})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount & Status */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">₹{booking.amount}</p>
                </div>

                <div className="text-right">
                  <div className="mb-3">
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        booking.isPaid
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      {booking.isPaid ? "Paid" : "Pending"}
                    </span>
                  </div>

                  {!booking.isPaid && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
```

---

## 2. Context/AppContext Updates

Update your AppContext to include theater and screen data fetching:

```jsx
// Add to AppContext.jsx

const fetchTheaters = async () => {
  try {
    const { data } = await axios.get("/api/theater/");
    if (data.success) {
      setTheaters(data.theaters);
    }
  } catch (error) {
    console.error("Error fetching theaters:", error);
  }
};

// Add to context value
const value = {
  // ... existing values
  theaters,
  fetchTheaters,
};
```

---

## 3. API Integration Notes

### Seat Selection Format
When sending selected seats, use this format:

```javascript
{
  seatNumber: "A1",
  tierName: "Standard"  // Must match tier in screen config
}
```

### Price Calculation
Prices are calculated server-side based on seat tier:
- Standard Tier: ₹150
- Premium Tier: ₹250
- VIP Tier: ₹400

### Show ID Parameter
The show selection now uses `showId` instead of just time. The URL format changes to:
```
/seat-layout/{showId}  // Previously: /seat-layout/{movieId}/{date}
```

---

## 4. Testing Component Updates

### Test Checklist

1. **Theater Selection**
   - [ ] Theaters load properly
   - [ ] Multiple theaters display
   - [ ] Selecting theater updates screens list

2. **Screen Selection**
   - [ ] Screens load for selected theater
   - [ ] Screen info displays (seat count, type)
   - [ ] Selecting screen updates shows list

3. **Show Selection**
   - [ ] Shows display for selected theater/screen
   - [ ] Show times are properly formatted
   - [ ] Clicking show navigates to seat layout

4. **Seat Layout**
   - [ ] Seats display in correct layout
   - [ ] Seats colored by tier
   - [ ] Tier legend shows prices
   - [ ] Occupied seats are disabled
   - [ ] Selected seats show selection state
   - [ ] Seat information tooltip shows on hover

5. **Booking**
   - [ ] Booking summary updates dynamically
   - [ ] Total price calculates correctly
   - [ ] Payment link redirects to Stripe
   - [ ] Booking appears in "My Bookings"

6. **My Bookings**
   - [ ] Theater info displays
   - [ ] Screen info displays
   - [ ] All booked seats show with tier and price
   - [ ] Can cancel unpaid bookings
   - [ ] Cancelled bookings release seats

---

## 5. Styling Recommendations

### Tier Color Scheme
```javascript
const tierColors = {
  Standard: "bg-blue-500 text-white",
  Premium: "bg-yellow-500 text-black",
  VIP: "bg-red-500 text-white",
};
```

### Responsive Design
- Mobile: Stack theater/screen selectors vertically
- Tablet: Two columns for layout
- Desktop: Full grid with legend on top

---

## 6. Error Handling

Add proper error handling for:

```javascript
// Theater load error
if (!theaters || theaters.length === 0) {
  return <div>No theaters available</div>;
}

// Screen load error
if (!screens || screens.length === 0) {
  return <div>No screens available for this theater</div>;
}

// Show load error
if (!selectedShowsData || selectedShowsData.length === 0) {
  return <div>No shows available for this selection</div>;
}

// Booking error
catch (error) {
  toast.error(error.response?.data?.message || "Booking failed");
}
```

---

## 7. Performance Optimization

```javascript
// Memoize theater list
const memoizedTheaters = useMemo(() => theaters, [theaters]);

// Debounce screen fetch
const debouncedFetchScreens = useCallback(
  debounce((theaterId) => fetchScreens(theaterId), 300),
  []
);

// Cache shows data
const showsCache = useRef({});
```

---

## 8. Accessibility Improvements

```jsx
// Add ARIA labels
<select
  aria-label="Select theater"
  aria-describedby="theater-help"
>

// Keyboard navigation support
<button
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleSeatClick(seatId);
    }
  }}
>
```

---

## Summary

Key changes needed:
1. ✅ Update SeatLayout to use seatTiers
2. ✅ Add theater/screen selection to MovieDetails
3. ✅ Update MyBookings to show theater/screen/seat details
4. ✅ Update AppContext with theater data
5. ✅ Handle new booking format with tierName
6. ✅ Add proper error handling
7. ✅ Implement responsive design
8. ✅ Add accessibility features

All frontend changes maintain backward compatibility while adding new functionality!

---

Good luck with the frontend integration! 🚀
