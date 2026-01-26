# Frontend Implementation Guide - Theater Booking System

## Overview

This guide walks you through integrating the new frontend components for the multi-theater, seat-tier booking system.

## 📋 Files to Update/Create

### 1. **SeatLayout_New.jsx** (NEW)
**Location:** `client/src/pages/SeatLayout_New.jsx`

**Purpose:** Replaces old single-theater seat layout with tier visualization

**Key Features:**
- Seat tier visualization with color coding (Blue=Standard, Yellow=Premium, Red=VIP)
- Real-time occupied seat fetching
- Dynamic pricing calculation
- Support for multiple seat selection (max 5)
- Booking summary with total price

**Integration Steps:**
1. Create the file with provided content
2. Update route in App.jsx to use SeatLayout_New instead of old SeatLayout
3. Replace old SeatLayout.jsx or keep both during transition

---

### 2. **MovieDetails.jsx** (UPDATED)
**Location:** `client/src/pages/MovieDetails.jsx`

**Purpose:** Add theater/screen/show selection UI before seat layout

**Changes Made:**
- Added state for theater/screen/show selection
- Added fetch functions for theaters, screens, shows
- Added new booking section with theater dropdown
- Screen dropdown dynamically loads based on selected theater
- Show times display as clickable buttons

**Required Updates:**
```jsx
// New state variables added
const [selectedTheater, setSelectedTheater] = useState(null);
const [selectedScreen, setSelectedScreen] = useState(null);
const [selectedShowId, setSelectedShowId] = useState(null);
const [theaters, setTheaters] = useState([]);
const [screens, setScreens] = useState([]);
const [shows, setShows] = useState({});
```

**New Functions Added:**
```jsx
const fetchTheaters = async () => { ... }        // GET /api/theater/
const fetchScreens = async (theaterId) => { ... } // GET /api/theater/{theaterId}/screens
const getShowsForSelection = async () => { ... }  // GET /api/show/by-movie/{movieId}
const handleTheaterChange = async (theaterId) => { ... }
```

**UI Section Added:**
Theater → Screen → Show Time selection dropdowns before navigating to SeatLayout_New

---

### 3. **Theatres.jsx** (UPDATED)
**Location:** `client/src/pages/Theatres.jsx`

**Purpose:** Implements "Search Theater" workflow

**Workflow Implemented:**
1. **Search**: Real-time theater filtering by name, city, location
2. **Select**: Theater card shows location, screens, contact info
3. **View Movies**: On selection, shows all movies at selected theater with times
4. **Select Movie**: Clicking movie navigates to MovieDetails page

**New Features:**
- Real-time search input
- Theater cards with hover effects
- Movie display with showtimes for selected theater
- Responsive grid layout
- API integration with error handling

**API Calls:**
- `GET /api/theater/` - Get all theaters
- `GET /api/show/all` - Get all shows (filtered by theater on frontend)

---

### 4. **MyBookings_New.jsx** (NEW)
**Location:** `client/src/pages/MyBookings_New.jsx`

**Purpose:** Display user bookings with theater, screen, and seat tier info

**Features:**
- Shows movie poster with booking details
- Displays theater name and address
- Shows screen number
- Lists booked seats with tier names and prices
- Shows show date and time
- Color-coded seat tier badges
- Cancel booking functionality (for unpaid bookings)
- Payment status indicator

**API Calls:**
- `GET /api/booking/my-bookings` - Get user's bookings
- `PUT /api/booking/{bookingId}/cancel` - Cancel unpaid booking

---

## 🔄 Complete User Workflows

### Workflow 1: "Buy Tickets" Flow
```
Home Page
    ↓
Movies Page (Browse all movies)
    ↓
Click Movie → MovieDetails Page
    ↓
Select Theater → Select Screen → Select Show Time
    ↓
SeatLayout_New (Select seats by tier)
    ↓
Booking Summary (Review: Theater, Screen, Seats, Total Price)
    ↓
Proceed to Payment (Stripe)
    ↓
View Bookings (MyBookings_New)
```

### Workflow 2: "Search Theater" Flow
```
Home Page
    ↓
Theatres Page (Search theater)
    ↓
Search/Select Theater
    ↓
View Movies at Selected Theater
    ↓
Click Movie → MovieDetails Page
    ↓
Select Screen → Select Show Time
    ↓
SeatLayout_New (Select seats by tier)
    ↓
Booking Summary (Review all details)
    ↓
Proceed to Payment (Stripe)
    ↓
View Bookings (MyBookings_New)
```

---

## 🛠️ Implementation Checklist

### Phase 1: Component Creation
- [ ] Create SeatLayout_New.jsx
- [ ] Create MyBookings_New.jsx
- [ ] Update MovieDetails.jsx with theater selection UI
- [ ] Update Theatres.jsx with search workflow

### Phase 2: Routing
- [ ] Update App.jsx routes to use new components
- [ ] Add route for `/seat-layout/:showId`
- [ ] Update navigation links to point to new components

### Phase 3: API Integration Testing
- [ ] Test GET /api/theater/ endpoint
- [ ] Test GET /api/theater/{theaterId}/screens endpoint
- [ ] Test GET /api/show/by-movie/{movieId} endpoint
- [ ] Test POST /api/booking/ endpoint with new format
- [ ] Test GET /api/booking/my-bookings endpoint
- [ ] Test PUT /api/booking/{bookingId}/cancel endpoint

### Phase 4: UI Testing
- [ ] Test theater dropdown loads correctly
- [ ] Test screen dropdown updates on theater change
- [ ] Test show times display correctly
- [ ] Test seat selection and tier visualization
- [ ] Test price calculation for multiple seats
- [ ] Test booking summary displays correctly
- [ ] Test payment flow completes
- [ ] Test booking appears in MyBookings

### Phase 5: User Flow Testing
- [ ] Complete "Buy Tickets" workflow end-to-end
- [ ] Complete "Search Theater" workflow end-to-end
- [ ] Test all error handling paths
- [ ] Test responsive design on mobile

---

## 📱 Component API Contracts

### SeatLayout_New.jsx
**Props:**
```jsx
{
  showId: string        // Show ID from URL or navigation
  movieTitle: string    // Movie title for display
}
```

**Expected Show Data Structure:**
```json
{
  "_id": "show123",
  "movie": { "title": "Movie Name", "genres": [...] },
  "theater": { "name": "Theater Name" },
  "screen": { "screenNumber": "A" },
  "showDateTime": "2024-01-15T18:30:00",
  "seatTiers": [
    {
      "tierName": "Standard",
      "price": 150,
      "occupiedSeats": { "A1": true, "A2": true }
    }
  ]
}
```

### MovieDetails.jsx - Theater Section
**Theater Selection UI Structure:**
```jsx
<select>
  {theaters.map(t => (
    <option value={t._id}>{t.name} - {t.city}</option>
  ))}
</select>

<select>
  {screens.map(s => (
    <option value={s._id}>Screen {s.screenNumber}</option>
  ))}
</select>

{/* Show times as buttons */}
{shows[selectedScreen]?.map(show => (
  <button onClick={() => navigate(`/seat-layout/${show._id}`)}>
    {new Date(show.showDateTime).toLocaleTimeString()}
  </button>
))}
```

### Theatres.jsx - Theater Search
**Theater Card Structure:**
```jsx
{
  "_id": "theater123",
  "name": "PVR Cinema",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "+91-9999999999",
  "email": "pvr@example.com",
  "screens": ["screen1", "screen2", "screen3"]
}
```

---

## 🎨 Styling Notes

### Color Scheme for Seat Tiers
- **Standard Tier**: Blue (bg-blue-500, text-blue-400)
- **Premium Tier**: Yellow (bg-yellow-500, text-yellow-400)
- **VIP Tier**: Red (bg-red-500, text-red-400)
- **Available Seat**: Gray (bg-gray-700)
- **Occupied Seat**: Dark Gray (bg-gray-600)
- **Selected Seat**: Primary Color (bg-primary)

### Layout Guidelines
- Desktop: 2-3 column grid for theater/movie cards
- Tablet: 2 column grid
- Mobile: 1 column full width
- Use Tailwind CSS utility classes for responsive design

---

## 🔗 Navigation Integration

**Update App.jsx routes:**
```jsx
// Old routes to update
import SeatLayout_New from './pages/SeatLayout_New';
import MyBookings_New from './pages/MyBookings_New';

// Replace in route list
<Route path="/seat-layout/:showId" element={<SeatLayout_New />} />
<Route path="/bookings" element={<MyBookings_New />} />
<Route path="/theatres" element={<Theatres />} />
```

**Update Navbar links:**
```jsx
// Navigation menu should link to:
- "/movies" - Browse all movies (Buy Tickets flow)
- "/theatres" - Search theaters (Search Theater flow)
- "/bookings" - View my bookings
```

---

## 🧪 Testing Scenarios

### Theater Selection
1. Open MovieDetails page
2. Verify theaters dropdown loads all theaters
3. Select a theater
4. Verify screens dropdown updates with that theater's screens
5. Select a screen
6. Verify show times display correctly

### Seat Selection
1. Click show time to navigate to SeatLayout_New
2. Verify seat grid displays with tier coloring
3. Verify tier prices display correctly
4. Click 2-3 seats across different tiers
5. Verify total price updates correctly
6. Verify selected seats highlight properly

### Booking Flow
1. Complete seat selection
2. Verify booking summary shows all details
3. Click "Proceed to Payment"
4. Verify Stripe payment dialog opens
5. Complete payment
6. Verify booking appears in MyBookings

### Theater Search
1. Navigate to Theatres page
2. Search for theater by name
3. Verify filtered results display
4. Select a theater
5. Verify movies at that theater display
6. Click a movie
7. Verify it navigates to MovieDetails with correct movie loaded
8. Continue with theater selection flow

---

## ⚠️ Common Integration Issues

### Issue: "Theater selection not loading"
**Solution:** 
- Verify GET /api/theater/ endpoint is working
- Check browser console for CORS errors
- Verify Authorization header includes valid token

### Issue: "Seats not showing as occupied"
**Solution:**
- Verify GET /api/show/{showId} returns seatTiers array
- Check occupiedSeats structure matches expected format
- Verify real-time fetching interval working (10 seconds)

### Issue: "Price calculation incorrect"
**Solution:**
- Verify each seat in bookedSeats has correct `tierName`
- Check tier price lookup in SeatLayout_New
- Verify backend returns correct price in booking creation response

### Issue: "MyBookings not loading"
**Solution:**
- Verify GET /api/booking/my-bookings endpoint exists
- Check user authentication token is valid
- Verify booking data includes theater and screen refs

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│ Home Page   │
└──────┬──────┘
       │
       ├──→ "/movies" → MovieDetails (Buy Tickets flow)
       │
       └──→ "/theatres" → Theatres → Select Theater → View Movies → MovieDetails (Search Theater flow)
                                                                           │
       ┌───────────────────────────────────────────────────────────────────┘
       │
       ├─→ Select Theater → Select Screen → Select Show Time
       │                                            │
       ├────────────────────────────────────────────┘
       │
       └──→ Navigate to SeatLayout_New with showId
                  │
                  ├─→ Display Seat Grid (Tier-colored)
                  ├─→ Show Pricing per Tier
                  ├─→ Handle Seat Selection
                  ├─→ Calculate Total Price
                  │
                  └──→ Create Booking via POST /api/booking/
                         │
                         ├─→ Get Payment Link
                         ├─→ Redirect to Stripe
                         │
                         └──→ Payment Success
                            │
                            └──→ Navigate to /bookings
                                │
                                └──→ MyBookings_New (View All Bookings)
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All components created and integrated
- [ ] All routes updated in App.jsx
- [ ] All API endpoints tested with real backend
- [ ] Error handling working for all failure scenarios
- [ ] Loading states visible during data fetching
- [ ] Mobile responsiveness tested on actual devices
- [ ] Authentication working (bearer token in all requests)
- [ ] Payment flow tested end-to-end
- [ ] Booking confirmation emails working
- [ ] Database migrations applied (Theater & Screen collections)
- [ ] Admin can create/edit theaters and screens
- [ ] Theater and screen data populated in database

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify API endpoints are returning correct data
3. Check network tab in developer tools for failed requests
4. Review error messages in toast notifications
5. Check backend logs for database/validation errors

---

**Last Updated:** January 2024
**System Status:** ✅ Complete - Ready for Testing & Deployment
