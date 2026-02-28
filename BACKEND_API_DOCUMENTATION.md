# TicketFlicks Backend API Documentation

## Overview

The backend is built with a clean, modular architecture:
- **Models**: Database schemas with validation
- **Services**: Business logic and data operations  
- **Controllers**: HTTP request/response handling
- **Routes**: API endpoints and middleware configuration
- **Middleware**: Error handling, validation, authentication

---

## Response Format

All API responses follow a standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error description",
  "status": 400
}
```

---

## Authentication

### Login
```
POST /api/auth/login
Body: { email, password }
Returns: { token, user }
```

### Signup
```
POST /api/auth/signup
Body: { name, email, phone, password }
Returns: { token, user }
```

### Request Password Reset OTP
```
POST /api/auth/forgot-password
Body: { email }
Returns: { success: true, message }
```

### Reset Password with OTP
```
POST /api/auth/reset-password
Body: { email, otp, newPassword }
Returns: { success: true, message }
```

### Change Password (Authenticated)
```
POST /api/auth/change-password
Headers: { Authorization: "Bearer token" }
Body: { currentPassword, newPassword, confirmPassword }
Returns: { success: true, message }
```

---

## User Management

### Get User Profile
```
GET /api/user/profile
Headers: { Authorization: "Bearer token" }
Returns: { success: true, user: {...} }
```

### Update User Profile
```
PUT /api/user/profile
Headers: { Authorization: "Bearer token" }
Body: { name, email, phone }
Returns: { success: true, user: {...} }
```

### Get User Bookings
```
GET /api/user/bookings
Headers: { Authorization: "Bearer token" }
Returns: { success: true, bookings: [...] }
```

### Get Favorites
```
GET /api/user/favorites
Headers: { Authorization: "Bearer token" }
Returns: { success: true, movies: [...] }
```

### Add to Favorites
```
POST /api/user/favorites
Headers: { Authorization: "Bearer token" }
Body: { movieId }
Returns: { success: true, message }
```

### Remove from Favorites
```
DELETE /api/user/favorites/:movieId
Headers: { Authorization: "Bearer token" }
Returns: { success: true, message }
```

### Toggle Favorite
```
PUT /api/user/favorites
Headers: { Authorization: "Bearer token" }
Body: { movieId }
Returns: { success: true, message, isFavorited }
```

---

## Booking System

### Get Available Shows
```
GET /api/show/list
Query: { movieId, theatreId, date }
Returns: { success: true, shows: [...] }
```

### Check Seat Availability
```
POST /api/booking/check-availability
Body: { showId, selectedSeats }
Returns: { success: true, available: boolean }
```

### Create Booking
```
POST /api/booking/create
Headers: { Authorization: "Bearer token" }
Body: { showId, selectedSeats }
Returns: { success: true, bookingId, totalAmount }
```

### Confirm Payment
```
POST /api/booking/confirm-payment
Headers: { Authorization: "Bearer token" }
Body: { sessionId }
Returns: { success: true, message }
```

### Get Booking Details
```
GET /api/booking/:bookingId
Headers: { Authorization: "Bearer token" }
Returns: { success: true, booking: {...} }
```

### Cancel Booking
```
POST /api/booking/:bookingId/cancel
Headers: { Authorization: "Bearer token" }
Body: { reason }
Returns: { success: true, message }
```

---

## Theatre Management

### Request Registration OTP
```
POST /api/theatre/register/request-otp
Body: { email }
Returns: { success: true, message, devOtp? }
```

### Register Theatre
```
POST /api/theatre/register
Body: {
  manager: { name, email, phone, password },
  theatre: { name, location, contact_no, email, address, city, state, zipCode },
  screens: [...],
  otp: "123456"
}
Returns: { success: true, theatreId, managerId }
```

### Get Theatre Details
```
GET /api/theatre/:theatreId
Returns: { success: true, theatre: {...} }
```

### List All Approved Theatres
```
GET /api/theatre/list
Query: { city, skip, limit }
Returns: { success: true, theatres: [...], pagination: {...} }
```

---

## Admin Operations

### Get Dashboard Data
```
GET /api/admin/dashboard
Headers: { Authorization: "Bearer token" }
Returns: { success: true, dashboardData: {...} }
```

### Get Pending Theatres
```
GET /api/admin/theatres/pending
Headers: { Authorization: "Bearer token" }
Returns: { success: true, theatres: [...] }
```

### Approve/Decline Theatre
```
POST /api/admin/theatres/:theatreId/approve
Headers: { Authorization: "Bearer token" }
Body: { action: "approve" | "decline", notes }
Returns: { success: true, status }
```

### Add Movie
```
POST /api/admin/movies/add
Headers: { Authorization: "Bearer token" }
Body: { title, description, genreIds, languageIds, ... }
Returns: { success: true, movieId }
```

---

## Manager Operations

### Create Show
```
POST /api/manager/shows/create
Headers: { Authorization: "Bearer token" }
Body: { movieId, screenId, showDateTime, language, basePrice, seatTiers }
Returns: { success: true, showId }
```

### Update Show
```
PUT /api/manager/shows/:showId
Headers: { Authorization: "Bearer token" }
Body: { showDateTime, basePrice, seatTiers }
Returns: { success: true, message }
```

### List Theatre Shows
```
GET /api/manager/shows
Headers: { Authorization: "Bearer token" }
Returns: { success: true, shows: [...] }
```

### Get Show Bookings
```
GET /api/manager/shows/:showId/bookings
Headers: { Authorization: "Bearer token" }
Returns: { success: true, bookings: [...] }
```

---

## Search & Discovery

### Search Movies
```
GET /api/search/movies
Query: { q, genre, language, page }
Returns: { success: true, movies: [...] }
```

### Search Theatres
```
GET /api/search/theatres
Query: { location, city, page }
Returns: { success: true, theatres: [...] }
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| VALIDATION_ERROR | 400 | Invalid input data |
| NOT_FOUND | 404 | Resource not found |
| ALREADY_EXISTS | 409 | Resource already exists |
| SEATS_UNAVAILABLE | 409 | Selected seats are booked |
| PAYMENT_FAILED | 402 | Payment processing failed |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- OTP endpoints: 5 requests per 15 minutes per email
- Login endpoint: 10 requests per 15 minutes per IP
- API endpoints: 100 requests per minute per user

---

## Data Validation Rules

### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (@$!%*?&)

### Email
- Valid email format
- Unique per user (for registration)

### Phone
- Exactly 10 digits

### OTP
- 6 digits
- Valid for 2 minutes (except signup OTP which is 10 minutes)

---

## Database Models

### User
```javascript
{
  name: String (required, 2+ chars),
  email: String (required, unique),
  phone: String (required, 10 digits),
  password_hash: String (required, select: false),
  role: Enum ["customer", "manager", "admin"],
  managedTheatreId: ObjectId (optional),
  favorites: [ObjectId],
  last_login: Date,
  isDeleted: Boolean,
  timestamps
}
```

### Movie
```javascript
{
  title: String (required, unique),
  genre_ids: [ObjectId],
  language_id: [ObjectId],
  duration_min: Number (required),
  release_date: Date (required),
  description: String (required, 10+ chars),
  poster_path: String,
  backdrop_path: String,
  trailer_link: String,
  cast: [ObjectId],
  imdbRating: Number (0-10),
  reviewCount: Number,
  isActive: Boolean,
  isDeleted: Boolean,
  timestamps
}
```

### Show
```javascript
{
  movie: ObjectId (required),
  theatre: ObjectId (required),
  screen: ObjectId (required),
  showDateTime: Date (required, future only),
  language: String,
  basePrice: Number,
  seatTiers: [{
    tierName: String,
    price: Number,
    totalSeats: Number,
    occupiedSeats: Object
  }],
  status: Enum ["available", "full", "cancelled"],
  totalCapacity: Number,
  cancellation_reason: String,
  cancelled_at: Date,
  timestamps
}
```

### Booking
```javascript
{
  user_id: ObjectId (required),
  show_id: ObjectId (required),
  seats_booked: [{
    seatNumber: String,
    tierName: String,
    price: Number
  }],
  total_amount: Number (required),
  status: Enum ["pending", "confirmed", "cancelled"],
  payment_status: Enum ["pending", "completed", "failed", "refunded"],
  payment_id: String,
  payment_method: Enum ["stripe", "manual"],
  refund_amount: Number,
  refunded_at: Date,
  cancellation_reason: String,
  cancelled_at: Date,
  timestamps
}
```

### Theatre
```javascript
{
  name: String (required),
  location: String (required),
  manager_id: ObjectId (required, must be manager user),
  contact_no: String (10 digits),
  email: String,
  address: String,
  city: String,
  state: String,
  zipCode: String (5-10 digits),
  step3_pdf_url: String,
  approval_status: Enum ["pending", "approved", "declined"],
  approval_date: Date,
  approval_notes: String,
  disabled: Boolean,
  disabled_reason: String,
  disabled_date: Date,
  isDeleted: Boolean,
  timestamps
}
```

---

## Environment Variables

```
NODE_ENV=development|production
PORT=3000
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
TMDB_API_KEY=tmdb-api-key
INR_TO_USD_RATE=0.011
```

---

## Testing the API

### Using curl
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","phone":"9876543210","password":"Test@123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test@123"}'

# Get Profile
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <token>"
```

### Using Postman
1. Import the collection from `/API_TESTING_GUIDE.md`
2. Set `{{token}}` variable from login response
3. Run requests

---

## Deployment

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure all environment variables
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Configure email service
- [ ] Test payment processing
- [ ] Set up CDN for media

---

## Performance Optimization

- Database indexes on frequently queried fields
- Proper query selection to avoid fetching unnecessary fields
- Pagination on list endpoints
- Caching on immutable data
- Connection pooling for database

---

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Email validation and OTP verification
- Input sanitization in services
- Proper error messages (no database details)
- Soft delete pattern for data integrity
- Rate limiting on sensitive endpoints
- CORS configuration
