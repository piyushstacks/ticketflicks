# 🎫 Theater Booking System - API Reference Card

## Quick Endpoint Reference

### 🏢 Theater Endpoints

#### GET /api/theater/
**Get all theaters**
```bash
curl -X GET http://localhost:3000/api/theater/
```
**Response:**
```json
{
  "success": true,
  "theaters": [
    {
      "_id": "theater123",
      "name": "PVR Cinemas",
      "address": "123 High St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400050",
      "phone": "+91-9999999999",
      "email": "pvr@example.com",
      "isActive": true,
      "screens": ["screen1", "screen2"]
    }
  ]
}
```

---

#### GET /api/theater/:id
**Get single theater with screens**
```bash
curl -X GET http://localhost:3000/api/theater/theater123
```
**Response:**
```json
{
  "success": true,
  "theater": {
    "_id": "theater123",
    "name": "PVR Cinemas",
    "address": "123 High St",
    "city": "Mumbai",
    "screens": [
      {
        "_id": "screen1",
        "screenNumber": "A",
        "seatLayout": {
          "rows": 12,
          "seatsPerRow": 20,
          "totalSeats": 240
        },
        "seatTiers": [
          {
            "tierName": "Standard",
            "price": 150,
            "rows": "1-8"
          }
        ]
      }
    ]
  }
}
```

---

#### POST /api/theater/ (Admin Only)
**Create new theater**
```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "PVR Cinemas",
    "address": "123 High St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400050",
    "phone": "+91-9999999999",
    "email": "pvr@example.com"
  }'
```

---

#### PUT /api/theater/:id (Admin Only)
**Update theater**
```bash
curl -X PUT http://localhost:3000/api/theater/theater123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "PVR Cinemas - Updated",
    "phone": "+91-8888888888"
  }'
```

---

#### DELETE /api/theater/:id (Admin Only)
**Delete theater**
```bash
curl -X DELETE http://localhost:3000/api/theater/theater123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 🖥️ Screen Endpoints

#### GET /api/theater/:theaterId/screens
**Get screens for theater**
```bash
curl -X GET http://localhost:3000/api/theater/theater123/screens
```
**Response:**
```json
{
  "success": true,
  "screens": [
    {
      "_id": "screen1",
      "screenNumber": "A",
      "theater": "theater123",
      "seatLayout": {
        "rows": 12,
        "seatsPerRow": 20,
        "totalSeats": 240
      },
      "seatTiers": [
        {
          "tierName": "Standard",
          "price": 150,
          "rows": "1-8"
        },
        {
          "tierName": "Premium",
          "price": 250,
          "rows": "9-10"
        },
        {
          "tierName": "VIP",
          "price": 350,
          "rows": "11-12"
        }
      ]
    }
  ]
}
```

---

#### POST /api/theater/screen/add (Admin Only)
**Create new screen**
```bash
curl -X POST http://localhost:3000/api/theater/screen/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "screenNumber": "A",
    "theater": "theater123",
    "seatLayout": {
      "rows": 12,
      "seatsPerRow": 20,
      "totalSeats": 240
    },
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 150,
        "rows": "1-8"
      },
      {
        "tierName": "Premium",
        "price": 250,
        "rows": "9-10"
      },
      {
        "tierName": "VIP",
        "price": 350,
        "rows": "11-12"
      }
    ]
  }'
```

---

#### PUT /api/theater/screen/:id (Admin Only)
**Update screen**
```bash
curl -X PUT http://localhost:3000/api/theater/screen/screen1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 160,
        "rows": "1-8"
      }
    ]
  }'
```

---

#### DELETE /api/theater/screen/:id (Admin Only)
**Delete screen**
```bash
curl -X DELETE http://localhost:3000/api/theater/screen/screen1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 🎬 Show Endpoints

#### GET /api/show/by-movie/:movieId
**Get shows for movie grouped by theater/screen**
```bash
curl -X GET http://localhost:3000/api/show/by-movie/550988
```
**Response:**
```json
{
  "success": true,
  "shows": {
    "theater123": {
      "name": "PVR Cinemas",
      "screens": {
        "screen1": {
          "screenNumber": "A",
          "shows": [
            {
              "_id": "show123",
              "showDateTime": "2024-01-15T18:30:00",
              "seatTiers": [
                {
                  "tierName": "Standard",
                  "price": 150,
                  "occupiedSeats": { "A1": true, "A2": true }
                }
              ]
            }
          ]
        }
      }
    }
  }
}
```

---

#### GET /api/show/:showId
**Get specific show details**
```bash
curl -X GET http://localhost:3000/api/show/show123
```
**Response:**
```json
{
  "success": true,
  "show": {
    "_id": "show123",
    "movie": { "title": "Movie Name", "genres": [...] },
    "theater": { "name": "Theater Name" },
    "screen": { "screenNumber": "A" },
    "showDateTime": "2024-01-15T18:30:00",
    "totalCapacity": 240,
    "occupiedSeatsCount": 45,
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 150,
        "occupiedSeats": { "A1": true, "A5": true }
      }
    ]
  }
}
```

---

### 🎫 Booking Endpoints

#### POST /api/booking/
**Create booking (User)**
```bash
curl -X POST http://localhost:3000/api/booking/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "showId": "show123",
    "selectedSeats": ["A1", "A2", "B5"]
  }'
```
**Response:**
```json
{
  "success": true,
  "booking": {
    "_id": "booking123",
    "user": "user123",
    "show": "show123",
    "theater": "theater123",
    "screen": "screen1",
    "bookedSeats": [
      {
        "seatNumber": "A1",
        "tierName": "Standard",
        "price": 150
      },
      {
        "seatNumber": "A2",
        "tierName": "Standard",
        "price": 150
      },
      {
        "seatNumber": "B5",
        "tierName": "Premium",
        "price": 250
      }
    ],
    "amount": 550,
    "isPaid": false,
    "paymentLink": "https://stripe.com/...",
    "paymentIntentId": "pi_12345"
  }
}
```

---

#### GET /api/booking/my-bookings
**Get user's bookings (User)**
```bash
curl -X GET http://localhost:3000/api/booking/my-bookings \
  -H "Authorization: Bearer USER_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "booking123",
      "show": {
        "movie": { "title": "Movie", "poster_path": "/..." },
        "showDateTime": "2024-01-15T18:30:00"
      },
      "theater": {
        "name": "PVR Cinemas",
        "address": "123 High St"
      },
      "screen": { "screenNumber": "A" },
      "bookedSeats": [...],
      "amount": 550,
      "isPaid": true,
      "createdAt": "2024-01-14T10:00:00"
    }
  ]
}
```

---

#### PUT /api/booking/:bookingId/cancel
**Cancel unpaid booking (User)**
```bash
curl -X PUT http://localhost:3000/api/booking/booking123/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "reason": "User cancelled"
  }'
```
**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "_id": "booking123",
    "status": "cancelled",
    "seatsReleased": 3
  }
}
```

---

## 🔐 Authentication

All endpoints (except GET endpoints without user-specific data) require:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token from Clerk:
```javascript
const token = await getToken();
// Use in headers: { Authorization: `Bearer ${token}` }
```

---

## 📊 Data Models Reference

### Theater
```javascript
{
  _id: ObjectId,
  name: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  phone: String,
  email: String,
  isActive: Boolean,
  screens: [ObjectId],  // References to Screen
  createdAt: Date,
  updatedAt: Date
}
```

### Screen
```javascript
{
  _id: ObjectId,
  screenNumber: String,  // "A", "B", etc.
  theater: ObjectId,     // Reference to Theater
  seatLayout: {
    rows: Number,
    seatsPerRow: Number,
    totalSeats: Number
  },
  seatTiers: [
    {
      tierName: String,      // "Standard", "Premium", "VIP"
      price: Number,
      rows: String           // "1-8", "9-10", etc.
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Show
```javascript
{
  _id: ObjectId,
  movie: ObjectId,       // Reference to Movie
  theater: ObjectId,     // Reference to Theater
  screen: ObjectId,      // Reference to Screen
  showDateTime: Date,
  totalCapacity: Number,
  occupiedSeatsCount: Number,
  seatTiers: [
    {
      tierName: String,
      occupiedSeats: Object  // { "A1": true, "A2": true }
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```javascript
{
  _id: ObjectId,
  user: ObjectId,        // Reference to User
  show: ObjectId,        // Reference to Show
  theater: ObjectId,     // Reference to Theater
  screen: ObjectId,      // Reference to Screen
  bookedSeats: [
    {
      seatNumber: String,
      tierName: String,
      price: Number
    }
  ],
  amount: Number,
  isPaid: Boolean,
  paymentLink: String,
  paymentIntentId: String,
  status: String,        // "confirmed", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing with Postman

### Collection Setup

1. **Create new Collection:** Theater Booking System
2. **Add Variables:**
   - `base_url`: http://localhost:3000
   - `user_token`: YOUR_USER_TOKEN
   - `admin_token`: YOUR_ADMIN_TOKEN
   - `theater_id`: (set after creating theater)
   - `show_id`: (set after creating show)

3. **Test Requests:**
   - Save theater ID from response after GET /api/theater/
   - Use in subsequent requests

### Sample Postman Flow

```
1. GET /api/theater/
   ├─ Save theater_id from response
   │
2. GET /api/theater/{{theater_id}}/screens
   ├─ View screens
   │
3. GET /api/show/by-movie/550988
   ├─ View shows for movie
   │
4. POST /api/booking/
   ├─ Create booking with selected seats
   │
5. GET /api/booking/my-bookings
   ├─ View created booking
```

---

## 🐛 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid selected seats"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Please log in to book tickets"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Only admins can create theaters"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Theater not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Server error: Check logs"
}
```

---

## 💡 Common API Patterns

### Pattern 1: Get and Filter
```javascript
// Fetch all shows for a movie
const response = await axios.get(`/api/show/by-movie/${movieId}`);
const theaters = response.data.shows;

// Filter by theater on frontend if needed
const moviesByTheater = theaters[selectedTheaterId];
```

### Pattern 2: Create and Redirect
```javascript
// Create booking
const bookingResponse = await axios.post('/api/booking/', {
  showId,
  selectedSeats
});

// Redirect to payment
window.location.href = bookingResponse.data.booking.paymentLink;
```

### Pattern 3: Get User Data
```javascript
// Get user bookings
const response = await axios.get('/api/booking/my-bookings');
const userBookings = response.data.bookings;

// Map to display format
const displayData = userBookings.map(b => ({
  movie: b.show.movie.title,
  theater: b.theater.name,
  seats: b.bookedSeats.map(s => s.seatNumber).join(", "),
  total: b.amount
}));
```

---

## 🚀 Performance Tips

1. **Cache Theater Data:**
   ```javascript
   // Fetch once and store in state/context
   const [theaters, setTheaters] = useState([]);
   
   useEffect(() => {
     if (!theaters.length) {
       fetchTheaters();
     }
   }, []);
   ```

2. **Debounce Search:**
   ```javascript
   const debouncedSearch = useCallback(
     debounce((value) => filterTheaters(value), 300),
     []
   );
   ```

3. **Pagination for Shows:**
   ```javascript
   // For large number of shows
   GET /api/show/by-movie/:movieId?page=1&limit=20
   ```

---

**Last Updated:** January 2024  
**API Version:** 1.0  
**Status:** ✅ Complete and Ready
