# Quick Reference Card - Theater Management System

## 🎬 System Overview
Multi-theater, multi-screen movie ticket booking with dynamic seat tier pricing.

---

## 📊 Data Models Quick Reference

### Theater
```javascript
{
  name, location, address, city, state, zipCode, phone, email,
  screens: [ObjectId], isActive: true
}
```

### Screen
```javascript
{
  screenNumber, theater: ObjectId,
  seatLayout: { rows: 10, seatsPerRow: 9, totalSeats: 90 },
  seatTiers: [
    { tierName: "Standard", price: 150, rows: ["A", "B", "C", "D"] },
    { tierName: "Premium", price: 250, rows: ["E", "F", "G", "H"] },
    { tierName: "VIP", price: 400, rows: ["I", "J"] }
  ],
  isActive: true
}
```

### Show
```javascript
{
  movie, theater, screen, showDateTime,
  seatTiers: [{ tierName, price, occupiedSeats: {} }],
  totalCapacity, occupiedSeatsCount
}
```

### Booking
```javascript
{
  user, show, theater, screen,
  bookedSeats: [{ seatNumber, tierName, price }],
  amount, isPaid, paymentLink, paymentIntentId
}
```

---

## 🔌 API Endpoints Quick Reference

### Theater (5 endpoints)
```
POST   /api/theater/                    Create theater
GET    /api/theater/                    Get all theaters
GET    /api/theater/:theaterId          Get theater
PUT    /api/theater/:theaterId          Update theater
DELETE /api/theater/:theaterId          Delete theater
```

### Screen (5 endpoints)
```
POST   /api/theater/:theaterId/screens              Create screen
GET    /api/theater/:theaterId/screens              Get screens
GET    /api/theater/screens/:screenId               Get screen
PUT    /api/theater/screens/:screenId               Update screen
DELETE /api/theater/screens/:screenId               Delete screen
```

### Show (4 endpoints)
```
POST   /api/show/add                    Add show (NEW)
GET    /api/show/all                    Get all shows
GET    /api/show/by-movie/:movieId      Get shows grouped (NEW)
GET    /api/show/show/:showId           Get show details (NEW)
```

### Booking (4 endpoints)
```
POST   /api/booking/create              Create booking
GET    /api/booking/seats/:showId       Get occupied seats
GET    /api/booking/my-bookings         Get my bookings (NEW)
PUT    /api/booking/:bookingId/cancel   Cancel booking (NEW)
```

---

## 💾 Creating Test Data

### Step 1: Create Theater
```bash
curl -X POST http://localhost:3000/api/theater/ \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"name":"PVR","location":"Downtown","address":"123 Main","city":"Mumbai","state":"Maharashtra"}'
```
Save returned `theater._id`

### Step 2: Create Screen
```bash
curl -X POST http://localhost:3000/api/theater/{THEATER_ID}/screens \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "screenNumber":"Screen 1",
    "seatLayout":{"rows":10,"seatsPerRow":9},
    "seatTiers":[
      {"tierName":"Standard","price":150,"rows":["A","B","C","D"]},
      {"tierName":"Premium","price":250,"rows":["E","F","G","H"]},
      {"tierName":"VIP","price":400,"rows":["I","J"]}
    ]
  }'
```
Save returned `screen._id`

### Step 3: Add Show
```bash
curl -X POST http://localhost:3000/api/show/add \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "movieId":"550",
    "theaterId":"{THEATER_ID}",
    "screenId":"{SCREEN_ID}",
    "showsInput":[{"date":"2024-01-22","time":["10:00","13:00","16:00"]}]
  }'
```

### Step 4: Get Shows
```bash
curl -X GET http://localhost:3000/api/show/by-movie/550
```
Get `showId` from response

### Step 5: Get Occupied Seats
```bash
curl -X GET http://localhost:3000/api/booking/seats/{SHOW_ID}
```
Verify seats are empty

### Step 6: Create Booking
```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "showId":"{SHOW_ID}",
    "selectedSeats":[
      {"seatNumber":"A1","tierName":"Standard"},
      {"seatNumber":"E5","tierName":"Premium"}
    ]
  }'
```
Response contains payment URL

---

## 🎯 Common Tasks

### Create Complete System
1. Create theater
2. Create screen with tiers
3. Add shows
4. Done!

### Book Seats
1. Get occupied seats
2. Select seats with tier info
3. Create booking
4. Redirect to payment

### Cancel Booking
```bash
curl -X PUT http://localhost:3000/api/booking/{BOOKING_ID}/cancel \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"reason":"Changed mind"}'
```

### View Bookings
```bash
curl -X GET http://localhost:3000/api/booking/my-bookings \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 📱 Frontend Integration Checklist

- [ ] Update `SeatLayout.jsx` with tier display
- [ ] Add theater selection to `MovieDetails.jsx`
- [ ] Add screen selection to `MovieDetails.jsx`
- [ ] Update `MyBookings.jsx` with theater/screen info
- [ ] Add tier color coding to seat layout
- [ ] Display prices in seat layout
- [ ] Pass `tierName` in booking request
- [ ] Handle new booking response format

---

## 🔍 Debugging Tips

| Issue | Check |
|-------|-------|
| Show not creating | Verify theaterId and screenId exist |
| Seats showing wrong | Check occupiedSeats in each tier |
| Wrong pricing | Verify tier configuration in screen |
| Bookings not loading | Ensure user is authenticated |
| Theater not found | Verify theater isActive = true |

---

## 📊 Pricing Examples

### Booking Example 1
- 2 Standard seats (A1, A2): 2 × ₹150 = ₹300
- 1 Premium seat (E5): 1 × ₹250 = ₹250
- **Total: ₹550**

### Booking Example 2
- 3 Standard seats (A1, A2, A3): 3 × ₹150 = ₹450
- 2 VIP seats (I1, I2): 2 × ₹400 = ₹800
- **Total: ₹1250**

---

## 🔐 Authentication Required

**Admin Operations:**
- Create theater
- Create screen
- Add show
- Update theater
- Delete theater/screen

**User Operations:**
- Create booking
- Cancel booking
- View my bookings

**Public Operations:**
- Get theaters
- Get screens
- Get shows
- Get occupied seats

---

## 📋 Test Checklist

- [ ] Theater creation
- [ ] Multiple screens per theater
- [ ] Tier configuration
- [ ] Show creation (multi-theater)
- [ ] Seat booking (dynamic pricing)
- [ ] Occupied seats display
- [ ] Booking cancellation
- [ ] Seat release after cancellation
- [ ] User booking history
- [ ] Error handling

---

## 🚨 Important Notes

1. **Prices**: Configured per screen, not global
2. **Tiers**: Fully customizable per screen
3. **Seats**: Format is `{ROW}{NUMBER}` (e.g., "A1")
4. **Dates**: Stored as UTC in MongoDB
5. **Payments**: Processed by Stripe with dynamic pricing
6. **Cancellation**: Releases seats to available pool

---

## 📞 Quick Help

**Getting started?** → Read `README_IMPLEMENTATION.md`

**Need API examples?** → See `API_TESTING_GUIDE.md`

**Integrating frontend?** → Check `FRONTEND_INTEGRATION_GUIDE.md`

**Complete reference?** → Review `THEATER_SYSTEM_DOCUMENTATION.md`

**Need to debug?** → See `IMPLEMENTATION_SUMMARY.md`

---

## ⚡ Quick Commands

```bash
# Get all theaters
curl http://localhost:3000/api/theater/

# Get all shows
curl http://localhost:3000/api/show/all

# Get shows for movie
curl http://localhost:3000/api/show/by-movie/550

# Check occupied seats
curl http://localhost:3000/api/booking/seats/{SHOW_ID}

# Get my bookings
curl http://localhost:3000/api/booking/my-bookings \
  -H "Authorization: Bearer {TOKEN}"
```

---

## 🎓 Learning Path

1. **Understand the system**: Review data models above
2. **Learn the API**: Try commands in "Quick Commands"
3. **Follow test flow**: Create theater → screen → show → booking
4. **Integrate frontend**: Implement components from guide
5. **Deploy**: Run the system

---

## 📈 What's Different from Old System

| Feature | Old | New |
|---------|-----|-----|
| Theaters | Single | Multiple |
| Screens | None | Multiple per theater |
| Pricing | Fixed | Dynamic by tier |
| Seat Tiers | None | Standard/Premium/VIP |
| Theater Selection | N/A | Required |
| Screen Selection | N/A | Required |
| Booking Details | Basic | Full tier info |

---

**Quick Reference Version 1.0 - January 16, 2026**

Keep this handy for rapid development! 🚀
