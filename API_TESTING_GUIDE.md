# API Testing Guide - Theater Management System

## Complete Testing Workflow

This guide provides step-by-step API testing examples using curl commands. You can also use Postman or any other REST client.

---

## Prerequisites
- Server running on `http://localhost:3000`
- Valid JWT token from authentication
- Replace `{TOKEN}` with your actual token
- Replace `{ID}` placeholders with actual returned IDs

---

## 1. THEATER MANAGEMENT

### 1.1 Create Theater
Creates a new cinema theater.

```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "PVR Cinemas Downtown",
    "location": "Downtown Shopping Mall",
    "address": "123 Main Street, New Building",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "phone": "+91-2265550000",
    "email": "downtown@pvr.co.in"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Theater created successfully",
  "theater": {
    "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "PVR Cinemas Downtown",
    "location": "Downtown Shopping Mall",
    "address": "123 Main Street, New Building",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "phone": "+91-2265550000",
    "email": "downtown@pvr.co.in",
    "screens": [],
    "isActive": true,
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

### 1.2 Create Second Theater
For testing multiple theaters:

```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "INOX Premium",
    "location": "Bandra West",
    "address": "456 Ocean Drive",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400050",
    "phone": "+91-2262550000",
    "email": "bandra@inox.co.in"
  }'
```

### 1.3 Get All Theaters
Fetch all active theaters.

```bash
curl -X GET http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "theaters": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
      "name": "PVR Cinemas Downtown",
      "location": "Downtown Shopping Mall",
      "screens": [],
      "isActive": true,
      ...
    },
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k2",
      "name": "INOX Premium",
      "location": "Bandra West",
      "screens": [],
      "isActive": true,
      ...
    }
  ]
}
```

### 1.4 Get Theater Details
Fetch specific theater with screens.

```bash
curl -X GET http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Content-Type: application/json"
```

### 1.5 Update Theater
Update theater information.

```bash
curl -X PUT http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "PVR Cinemas Downtown - Updated",
    "phone": "+91-2265550001",
    "email": "contact@pvr.co.in"
  }'
```

### 1.6 Delete Theater
Soft delete theater (sets isActive to false).

```bash
curl -X DELETE http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 2. SCREEN MANAGEMENT

### 2.1 Create Screen for Theater 1
Creates a screen with seat tier configuration.

**Theater ID:** `67a1b2c3d4e5f6g7h8i9j0k1`

```bash
curl -X POST http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1/screens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
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

**Response:**
```json
{
  "success": true,
  "message": "Screen created successfully",
  "screen": {
    "_id": "67a1b2c3d4e5f6g7h8i9j1k2",
    "screenNumber": "Screen 1",
    "theater": "67a1b2c3d4e5f6g7h8i9j0k1",
    "seatLayout": {
      "rows": 10,
      "seatsPerRow": 9,
      "totalSeats": 90
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
    ],
    "isActive": true,
    "created_at": "2024-01-20T10:35:00Z",
    "updated_at": "2024-01-20T10:35:00Z"
  }
}
```

### 2.2 Create Second Screen for Same Theater
Different layout for Screen 2:

```bash
curl -X POST http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1/screens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "screenNumber": "Screen 2 - IMAX",
    "seatLayout": {
      "rows": 12,
      "seatsPerRow": 12
    },
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 200,
        "rows": ["A", "B", "C", "D", "E"]
      },
      {
        "tierName": "Premium",
        "price": 350,
        "rows": ["F", "G", "H", "I"]
      },
      {
        "tierName": "VIP",
        "price": 500,
        "rows": ["J", "K", "L"]
      }
    ]
  }'
```

### 2.3 Get All Screens for Theater
Fetch screens for a specific theater.

```bash
curl -X GET http://localhost:3000/api/theater/67a1b2c3d4e5f6g7h8i9j0k1/screens \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "screens": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j1k2",
      "screenNumber": "Screen 1",
      "theater": "67a1b2c3d4e5f6g7h8i9j0k1",
      "seatLayout": { "rows": 10, "seatsPerRow": 9, "totalSeats": 90 },
      "seatTiers": [...],
      "isActive": true
    },
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j1k3",
      "screenNumber": "Screen 2 - IMAX",
      "theater": "67a1b2c3d4e5f6g7h8i9j0k1",
      "seatLayout": { "rows": 12, "seatsPerRow": 12, "totalSeats": 144 },
      "seatTiers": [...],
      "isActive": true
    }
  ]
}
```

### 2.4 Get Screen Details
Fetch specific screen configuration.

```bash
curl -X GET http://localhost:3000/api/theater/screens/67a1b2c3d4e5f6g7h8i9j1k2 \
  -H "Content-Type: application/json"
```

### 2.5 Update Screen
Update screen tiers or layout.

```bash
curl -X PUT http://localhost:3000/api/theater/screens/67a1b2c3d4e5f6g7h8i9j1k2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "screenNumber": "Screen 1 - Premium",
    "seatLayout": {
      "rows": 10,
      "seatsPerRow": 9
    },
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 150,
        "rows": ["A", "B", "C"]
      },
      {
        "tierName": "Premium",
        "price": 300,
        "rows": ["D", "E", "F", "G", "H", "I", "J"]
      }
    ]
  }'
```

### 2.6 Delete Screen
Delete a screen from theater.

```bash
curl -X DELETE http://localhost:3000/api/theater/screens/67a1b2c3d4e5f6g7h8i9j1k2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 3. SHOW MANAGEMENT

### 3.1 Add Show
Add shows for a movie in specific theater/screen.

**Movie ID:** `550` (The Dark Knight)
**Theater ID:** `67a1b2c3d4e5f6g7h8i9j0k1`
**Screen ID:** `67a1b2c3d4e5f6g7h8i9j1k2`

```bash
curl -X POST http://localhost:3000/api/show/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "movieId": "550",
    "theaterId": "67a1b2c3d4e5f6g7h8i9j0k1",
    "screenId": "67a1b2c3d4e5f6g7h8i9j1k2",
    "showsInput": [
      {
        "date": "2024-01-22",
        "time": ["10:00", "13:00", "16:00", "19:00", "22:00"]
      },
      {
        "date": "2024-01-23",
        "time": ["12:00", "15:00", "18:00", "21:00"]
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Show Added Successfully."
}
```

### 3.2 Add Show to Different Theater
Same movie, different theater:

```bash
curl -X POST http://localhost:3000/api/show/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "movieId": "550",
    "theaterId": "67a1b2c3d4e5f6g7h8i9j0k2",
    "screenId": "{INOX_SCREEN_ID}",
    "showsInput": [
      {
        "date": "2024-01-22",
        "time": ["09:00", "12:00", "15:00", "18:00", "21:00"]
      }
    ]
  }'
```

### 3.3 Get All Shows
Fetch all active shows across all theaters.

```bash
curl -X GET http://localhost:3000/api/show/all \
  -H "Content-Type: application/json"
```

### 3.4 Get Shows for Specific Movie (Grouped by Theater/Screen)
Get shows organized by theater and screen.

```bash
curl -X GET http://localhost:3000/api/show/by-movie/550 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "groupedShows": {
    "67a1b2c3d4e5f6g7h8i9j0k1": {
      "theater": {
        "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "PVR Cinemas Downtown",
        "location": "Downtown Shopping Mall",
        "address": "123 Main Street",
        "city": "Mumbai"
      },
      "screens": {
        "67a1b2c3d4e5f6g7h8i9j1k2": {
          "screen": {
            "_id": "67a1b2c3d4e5f6g7h8i9j1k2",
            "screenNumber": "Screen 1",
            "seatLayout": { "rows": 10, "seatsPerRow": 9, "totalSeats": 90 }
          },
          "shows": [
            {
              "_id": "67a1b2c3d4e5f6g7h8i9j2k3",
              "movie": "550",
              "showDateTime": "2024-01-22T10:00:00Z",
              "seatTiers": [...]
            },
            {
              "_id": "67a1b2c3d4e5f6g7h8i9j2k4",
              "movie": "550",
              "showDateTime": "2024-01-22T13:00:00Z",
              "seatTiers": [...]
            }
          ]
        }
      }
    }
  }
}
```

### 3.5 Get Specific Show Details
Get details of a single show including seat tiers.

**Show ID:** `67a1b2c3d4e5f6g7h8i9j2k3`

```bash
curl -X GET http://localhost:3000/api/show/show/67a1b2c3d4e5f6g7h8i9j2k3 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "show": {
    "_id": "67a1b2c3d4e5f6g7h8i9j2k3",
    "movie": {
      "_id": "550",
      "title": "The Dark Knight",
      "overview": "...",
      "poster_path": "/path/to/poster.jpg"
    },
    "theater": {
      "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
      "name": "PVR Cinemas Downtown"
    },
    "screen": {
      "_id": "67a1b2c3d4e5f6g7h8i9j1k2",
      "screenNumber": "Screen 1",
      "seatLayout": { "rows": 10, "seatsPerRow": 9, "totalSeats": 90 }
    },
    "showDateTime": "2024-01-22T10:00:00Z",
    "seatTiers": [
      {
        "tierName": "Standard",
        "price": 150,
        "occupiedSeats": {}
      },
      {
        "tierName": "Premium",
        "price": 250,
        "occupiedSeats": {}
      },
      {
        "tierName": "VIP",
        "price": 400,
        "occupiedSeats": {}
      }
    ],
    "totalCapacity": 90,
    "occupiedSeatsCount": 0
  }
}
```

---

## 4. BOOKING MANAGEMENT

### 4.1 Get Available Seats for Show
Check occupied seats and seat tiers for a show.

```bash
curl -X GET http://localhost:3000/api/booking/seats/67a1b2c3d4e5f6g7h8i9j2k3 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "occupiedSeats": [],
  "seatTiers": [
    {
      "tierName": "Standard",
      "price": 150,
      "occupiedSeats": {}
    },
    {
      "tierName": "Premium",
      "price": 250,
      "occupiedSeats": {}
    },
    {
      "tierName": "VIP",
      "price": 400,
      "occupiedSeats": {}
    }
  ],
  "totalCapacity": 90,
  "occupiedSeatsCount": 0
}
```

### 4.2 Create Booking
Book seats with tier information.

**User Token:** Required (authenticated user)

```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "showId": "67a1b2c3d4e5f6g7h8i9j2k3",
    "selectedSeats": [
      {
        "seatNumber": "A1",
        "tierName": "Standard"
      },
      {
        "seatNumber": "A2",
        "tierName": "Standard"
      },
      {
        "seatNumber": "E5",
        "tierName": "Premium"
      },
      {
        "seatNumber": "I1",
        "tierName": "VIP"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

**Calculation:**
- Standard (A1, A2): 150 × 2 = ₹300
- Premium (E5): 250 × 1 = ₹250
- VIP (I1): 400 × 1 = ₹400
- **Total: ₹950**

### 4.3 Book Multiple Standard Seats
Another booking example:

```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "showId": "67a1b2c3d4e5f6g7h8i9j2k3",
    "selectedSeats": [
      { "seatNumber": "B1", "tierName": "Standard" },
      { "seatNumber": "B2", "tierName": "Standard" },
      { "seatNumber": "B3", "tierName": "Standard" }
    ]
  }'
```

### 4.4 Get Occupied Seats After Booking
Check seats after booking (still unpaid):

```bash
curl -X GET http://localhost:3000/api/booking/seats/67a1b2c3d4e5f6g7h8i9j2k3 \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "occupiedSeats": ["A1", "A2", "B1", "B2", "B3", "E5", "I1"],
  "seatTiers": [
    {
      "tierName": "Standard",
      "price": 150,
      "occupiedSeats": {
        "A1": "user_id_1",
        "A2": "user_id_1",
        "B1": "user_id_2",
        "B2": "user_id_2",
        "B3": "user_id_2"
      }
    },
    {
      "tierName": "Premium",
      "price": 250,
      "occupiedSeats": {
        "E5": "user_id_1"
      }
    },
    {
      "tierName": "VIP",
      "price": 400,
      "occupiedSeats": {
        "I1": "user_id_1"
      }
    }
  ],
  "totalCapacity": 90,
  "occupiedSeatsCount": 7
}
```

### 4.5 Get User's Bookings
Fetch all bookings for logged-in user.

```bash
curl -X GET http://localhost:3000/api/booking/my-bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}"
```

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "67a1b2c3d4e5f6g7h8i9j3k4",
      "user": "user_id_1",
      "show": {
        "_id": "67a1b2c3d4e5f6g7h8i9j2k3",
        "movie": { "_id": "550", "title": "The Dark Knight" },
        "showDateTime": "2024-01-22T10:00:00Z"
      },
      "theater": {
        "_id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "PVR Cinemas Downtown"
      },
      "screen": {
        "_id": "67a1b2c3d4e5f6g7h8i9j1k2",
        "screenNumber": "Screen 1"
      },
      "bookedSeats": [
        { "seatNumber": "A1", "tierName": "Standard", "price": 150 },
        { "seatNumber": "A2", "tierName": "Standard", "price": 150 },
        { "seatNumber": "E5", "tierName": "Premium", "price": 250 },
        { "seatNumber": "I1", "tierName": "VIP", "price": 400 }
      ],
      "amount": 950,
      "isPaid": false,
      "paymentLink": "https://checkout.stripe.com/pay/cs_test_xxxxx",
      "paymentIntentId": "pi_test_xxxxx",
      "createdAt": "2024-01-20T15:30:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  ]
}
```

### 4.6 Cancel Booking
Cancel an unpaid booking and release seats.

**Booking ID:** `67a1b2c3d4e5f6g7h8i9j3k4`

```bash
curl -X PUT http://localhost:3000/api/booking/67a1b2c3d4e5f6g7h8i9j3k4/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "reason": "Changed my mind"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

### 4.7 Check Occupied Seats After Cancellation
Verify seats are released:

```bash
curl -X GET http://localhost:3000/api/booking/seats/67a1b2c3d4e5f6g7h8i9j2k3 \
  -H "Content-Type: application/json"
```

**Response:** Seats A1, A2, E5, I1 should be released (no longer in occupiedSeats)

---

## 5. ERROR SCENARIOS

### 5.1 Invalid Theater ID
```bash
curl -X POST http://localhost:3000/api/theater/invalid_id/screens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "screenNumber": "Screen 1",
    "seatLayout": { "rows": 10, "seatsPerRow": 9 },
    "seatTiers": [...]
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Theater not found"
}
```

### 5.2 Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "name": "PVR Cinemas"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Please provide all required fields"
}
```

### 5.3 Booking Unavailable Seats
```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "showId": "67a1b2c3d4e5f6g7h8i9j2k3",
    "selectedSeats": [
      { "seatNumber": "A1", "tierName": "Standard" }
    ]
  }'
```

**Response (if A1 already booked):**
```json
{
  "success": false,
  "message": "Selected seats are not available."
}
```

---

## Testing Checklist

Complete this checklist to verify everything works:

- [ ] Create theater 1 (PVR Downtown)
- [ ] Create theater 2 (INOX Premium)
- [ ] Create screen 1 for theater 1 (10 rows, Standard/Premium/VIP)
- [ ] Create screen 2 for theater 1 (12 rows, IMAX)
- [ ] Create screen 1 for theater 2 (10 rows)
- [ ] Add shows for movie 550 in theater 1, screen 1 (5 time slots)
- [ ] Add shows for movie 550 in theater 1, screen 2 (4 time slots)
- [ ] Add shows for movie 550 in theater 2, screen 1 (5 time slots)
- [ ] Get shows grouped by theater/screen for movie 550
- [ ] Get available seats for a show (should be 90 empty seats)
- [ ] Book 3 Standard seats + 1 Premium seat (verify pricing)
- [ ] Check occupied seats (verify they show as occupied)
- [ ] Get user bookings (verify booking details)
- [ ] Try booking the same seat (should fail)
- [ ] Cancel booking (verify seats are released)
- [ ] Check occupied seats again (verify they're released)

---

## Notes

1. **Timezone:** All dates/times are stored in UTC. Use `date-fns-tz` for proper conversion.
2. **Pricing:** Calculated based on seat tier, not fixed price.
3. **Seat Format:** Seats are `{ROW}{NUMBER}`, e.g., "A1", "B5", "I10"
4. **Token:** Required for admin and user endpoints
5. **Pagination:** Not implemented yet; add if needed for large datasets

---

## Quick Summary

| Action | Method | Endpoint |
|--------|--------|----------|
| Create Theater | POST | `/api/theater/` |
| Get Theaters | GET | `/api/theater/` |
| Create Screen | POST | `/api/theater/{theaterId}/screens` |
| Get Screens | GET | `/api/theater/{theaterId}/screens` |
| Add Show | POST | `/api/show/add` |
| Get Shows | GET | `/api/show/by-movie/{movieId}` |
| Get Occupied Seats | GET | `/api/booking/seats/{showId}` |
| Create Booking | POST | `/api/booking/create` |
| Get My Bookings | GET | `/api/booking/my-bookings` |
| Cancel Booking | PUT | `/api/booking/{bookingId}/cancel` |

---

Good luck with testing! 🚀
