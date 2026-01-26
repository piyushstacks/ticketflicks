# TicketFlicks - Theater Management System Implementation

## Overview
This document details the implementation of a comprehensive theater management system with support for:
- Multiple theaters
- Multiple screens per theater
- Seats organized by tiers (Standard, Premium, VIP) with different prices
- MongoDB integration for all entities

---

## MongoDB Collections Structure

### 1. **Theater Collection**
Stores information about cinema theaters.

```javascript
{
  _id: ObjectId,
  name: "PVR Cinemas Downtown",
  location: "Downtown Mall",
  address: "123 Main Street",
  city: "Mumbai",
  state: "Maharashtra",
  zipCode: "400001",
  phone: "+91-9876543210",
  email: "contact@pvr-downtown.com",
  screens: [ObjectId, ObjectId, ...], // References to Screen documents
  isActive: true,
  created_at: Date,
  updated_at: Date
}
```

### 2. **Screen Collection**
Stores information about individual screens within a theater.

```javascript
{
  _id: ObjectId,
  screenNumber: "Screen 1",
  theater: ObjectId, // Reference to Theater
  seatLayout: {
    rows: 10,        // Number of rows (A-J)
    seatsPerRow: 9,  // Seats per row
    totalSeats: 90   // Total seats (rows × seatsPerRow)
  },
  seatTiers: [
    {
      tierName: "Standard",
      price: 150,
      rows: ["A", "B", "C", "D"], // Which rows belong to this tier
      seatsPerRow: 9 // Optional: can differ from default
    },
    {
      tierName: "Premium",
      price: 250,
      rows: ["E", "F", "G", "H"],
      seatsPerRow: 9
    },
    {
      tierName: "VIP",
      price: 400,
      rows: ["I", "J"],
      seatsPerRow: 9
    }
  ],
  isActive: true,
  created_at: Date,
  updated_at: Date
}
```

### 3. **Show Collection** (Updated)
Stores movie show information with seat tier management.

```javascript
{
  _id: ObjectId,
  movie: "550",              // Movie ID from TMDB
  theater: ObjectId,         // Reference to Theater
  screen: ObjectId,          // Reference to Screen
  showDateTime: Date,        // UTC datetime of the show
  seatTiers: [
    {
      tierName: "Standard",
      price: 150,
      occupiedSeats: {
        "A1": "user_id_1",
        "A2": "user_id_2",
        ...
      }
    },
    {
      tierName: "Premium",
      price: 250,
      occupiedSeats: {
        "E5": "user_id_3",
        ...
      }
    },
    {
      tierName: "VIP",
      price: 400,
      occupiedSeats: {
        "I1": "user_id_4",
        ...
      }
    }
  ],
  totalCapacity: 90,
  occupiedSeatsCount: 25,
  created_at: Date,
  updated_at: Date
}
```

### 4. **Booking Collection** (Updated)
Stores booking information with seat tier details.

```javascript
{
  _id: ObjectId,
  user: "user_id",           // User ID
  show: ObjectId,            // Reference to Show
  theater: ObjectId,         // Reference to Theater
  screen: ObjectId,          // Reference to Screen
  bookedSeats: [
    {
      seatNumber: "A1",
      tierName: "Standard",
      price: 150
    },
    {
      seatNumber: "E5",
      tierName: "Premium",
      price: 250
    }
  ],
  amount: 400,               // Total amount (sum of all seat prices)
  isPaid: false,
  paymentLink: "https://checkout.stripe.com/...",
  paymentIntentId: "pi_xxxxx",
  cancellationReason: null,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **User Collection** (Unchanged)
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@example.com",
  phone: "+91-9876543210",
  password_hash: "hashed_password",
  role: "customer", // "customer" or "admin"
  last_login: Date,
  favorites: ["550", "551", ...], // Movie IDs
  created_at: Date,
  updated_at: Date
}
```

### 6. **Movie Collection** (Unchanged)
```javascript
{
  _id: "550", // TMDB Movie ID
  title: "The Dark Knight",
  overview: "Movie description...",
  poster_path: "/path/to/poster.jpg",
  backdrop_path: "/path/to/backdrop.jpg",
  release_date: "2024-01-15",
  original_language: "en",
  tagline: "Movie tagline",
  genres: [...],
  casts: [...],
  vote_average: 8.5,
  runtime: 152,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **Feedback Collection** (Updated)
```javascript
{
  _id: ObjectId,
  user: "user_id",
  show: ObjectId,            // Reference to Show (new)
  theater: ObjectId,         // Reference to Theater (new)
  rating: 4,                 // 1-5
  message: "Great experience!",
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### Theater Management

#### Create Theater
```
POST /api/theater/
Body: {
  name, location, address, city, state, zipCode, phone, email
}
Response: { success, message, theater }
```

#### Get All Theaters
```
GET /api/theater/
Response: { success, theaters }
```

#### Get Theater Details
```
GET /api/theater/{theaterId}
Response: { success, theater }
```

#### Update Theater
```
PUT /api/theater/{theaterId}
Body: { name, location, address, city, state, zipCode, phone, email }
Response: { success, message, theater }
```

#### Delete Theater
```
DELETE /api/theater/{theaterId}
Response: { success, message }
```

### Screen Management

#### Create Screen
```
POST /api/theater/{theaterId}/screens
Body: {
  screenNumber,
  seatLayout: { rows, seatsPerRow },
  seatTiers: [
    { tierName, price, rows },
    { tierName, price, rows },
    ...
  ]
}
Response: { success, message, screen }
```

#### Get Screens by Theater
```
GET /api/theater/{theaterId}/screens
Response: { success, screens }
```

#### Get Screen Details
```
GET /api/theater/screens/{screenId}
Response: { success, screen }
```

#### Update Screen
```
PUT /api/theater/screens/{screenId}
Body: { screenNumber, seatLayout, seatTiers }
Response: { success, message, screen }
```

#### Delete Screen
```
DELETE /api/theater/screens/{screenId}
Response: { success, message }
```

### Show Management

#### Add Show
```
POST /api/show/add
Body: {
  movieId,
  theaterId,
  screenId,
  showsInput: [
    {
      date: "2024-01-20",
      time: ["10:00", "13:00", "16:00", "19:00", "22:00"]
    }
  ]
}
Response: { success, message }
```

#### Get All Shows
```
GET /api/show/all
Response: { success, shows }
```

#### Get Shows by Movie
```
GET /api/show/by-movie/{movieId}
Response: {
  success,
  groupedShows: {
    theaterId: {
      theater: {},
      screens: {
        screenId: {
          screen: {},
          shows: []
        }
      }
    }
  }
}
```

#### Get Show Details
```
GET /api/show/show/{showId}
Response: { success, show }
```

### Booking Management

#### Create Booking
```
POST /api/booking/create
Body: {
  showId,
  selectedSeats: [
    { seatNumber: "A1", tierName: "Standard" },
    { seatNumber: "E5", tierName: "Premium" }
  ]
}
Response: { success, url }
```

#### Get Occupied Seats
```
GET /api/booking/seats/{showId}
Response: {
  success,
  occupiedSeats,
  seatTiers,
  totalCapacity,
  occupiedSeatsCount
}
```

#### Get User Bookings
```
GET /api/booking/my-bookings
Response: { success, bookings }
```

#### Cancel Booking
```
PUT /api/booking/{bookingId}/cancel
Body: { reason }
Response: { success, message }
```

---

## Example: Creating Complete Theater Setup

### Step 1: Create Theater
```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PVR Cinemas",
    "location": "Downtown",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "phone": "+919876543210",
    "email": "contact@pvr.com"
  }'
```
Response: `{ success: true, theater: { _id: "theater_1", ... } }`

### Step 2: Create Screen with Seat Tiers
```bash
curl -X POST http://localhost:3000/api/theater/theater_1/screens \
  -H "Content-Type: application/json" \
  -d '{
    "screenNumber": "Screen 1",
    "seatLayout": {
      "rows": 10,
      "seatsPerRow": 9
    },
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 150,
        "rows": ["A", "B", "C", "D"]
      },
      {
        "tierName": "Premium",
        "price": 250,
        "rows": ["E", "F", "G", "H"]
      },
      {
        "tierName": "VIP",
        "price": 400,
        "rows": ["I", "J"]
      }
    ]
  }'
```
Response: `{ success: true, screen: { _id: "screen_1", ... } }`

### Step 3: Add Show
```bash
curl -X POST http://localhost:3000/api/show/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "movieId": "550",
    "theaterId": "theater_1",
    "screenId": "screen_1",
    "showsInput": [
      {
        "date": "2024-01-20",
        "time": ["10:00", "13:00", "16:00", "19:00", "22:00"]
      }
    ]
  }'
```
Response: `{ success: true, message: "Show Added Successfully." }`

---

## Features Implemented

### ✅ Multiple Theaters
- Create and manage multiple cinema theaters
- Each theater has location, address, and contact details
- Theater activation/deactivation

### ✅ Multiple Screens
- Each theater can have multiple screens
- Each screen has configurable seat layout
- Screen activation/deactivation

### ✅ Seat Tiers with Dynamic Pricing
- **Standard Tier**: Rows A-D, Price ₹150
- **Premium Tier**: Rows E-H, Price ₹250
- **VIP Tier**: Rows I-J, Price ₹400
- Each seat tier is configurable per screen
- Different prices for different tiers

### ✅ MongoDB Integration
- All data properly stored in MongoDB
- References between collections (theater → screen → show → booking)
- Proper indexing and optimization
- Atomic seat reservation operations

### ✅ Booking System
- Seat availability checking across tiers
- Automatic price calculation based on seat tier
- Booking confirmation with Stripe payment
- Cancellation with seat release

### ✅ Admin Features
- Create/Update/Delete theaters
- Create/Update/Delete screens
- Configure seat tiers and pricing
- Add shows to specific theater/screen combinations
- View all bookings and shows

---

## Database Indexes (Recommended)

For optimal performance, create these indexes:

```javascript
// Shows collection
db.shows.createIndex({ theater: 1, screen: 1 })
db.shows.createIndex({ movie: 1, showDateTime: 1 })
db.shows.createIndex({ showDateTime: 1 })

// Bookings collection
db.bookings.createIndex({ user: 1, createdAt: -1 })
db.bookings.createIndex({ show: 1 })
db.bookings.createIndex({ isPaid: 1 })

// Theaters collection
db.theaters.createIndex({ isActive: 1 })

// Screens collection
db.screens.createIndex({ theater: 1, isActive: 1 })
```

---

## Error Handling

All endpoints follow this response format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Migration Guide (If upgrading from old system)

If you have existing shows with the old `showPrice` and `occupiedSeats` structure:

1. **Backup your MongoDB database**
2. **Export existing data** from Show and Booking collections
3. **Create new Theater and Screen documents** with appropriate configurations
4. **Update Show documents** to include theater, screen, and seatTiers structure
5. **Update Booking documents** to include theater, screen, and bookedSeats with tier information
6. **Test thoroughly** before going live

---

## Notes for Frontend Integration

### Updated SeatLayout Component
The seat layout component should now:
1. Accept `seatTiers` data from the show
2. Display seats organized by tier
3. Color-code or visually differentiate tiers
4. Show price per seat tier
5. Handle booking with tier information

### Updated MovieDetails Component
Should now:
1. Show theater and screen selection before date/time selection
2. Display available shows grouped by theater and screen
3. Show seat tier information and pricing

### Example Frontend API Call (Creating Booking)
```javascript
const selectedSeats = [
  { seatNumber: "A1", tierName: "Standard" },
  { seatNumber: "E5", tierName: "Premium" }
];

const response = await axios.post('/api/booking/create', {
  showId: showId,
  selectedSeats: selectedSeats
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Testing Checklist

- [ ] Create theater successfully
- [ ] Create multiple screens in theater
- [ ] Create shows for specific theater/screen
- [ ] Fetch shows grouped by theater
- [ ] Book seats from different tiers
- [ ] Verify pricing calculation
- [ ] Check occupied seats update correctly
- [ ] Cancel booking and release seats
- [ ] Verify admin-only endpoints require authentication
- [ ] Test error handling for invalid inputs
- [ ] Performance test with large number of shows

---

## Support for Doubts

If you have any questions about:
1. **MongoDB Schema**: Check the Collections Structure section above
2. **API Usage**: See the API Endpoints section
3. **Setup**: Follow the "Creating Complete Theater Setup" example
4. **Frontend Changes**: See "Notes for Frontend Integration"

Feel free to ask for clarification on any aspect!
