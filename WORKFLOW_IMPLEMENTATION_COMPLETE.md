# Movie Ticketing Workflow Implementation - COMPLETE ✅

## Overview

The complete role-based movie ticketing workflow has been successfully implemented. This document outlines the entire architecture, API endpoints, and data flow.

## 1. Workflow Architecture

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETE WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: ADMIN MANAGES GLOBAL MOVIE POOL                           │
│  ────────────────────────────────────────                          │
│  Admin syncs movies from TMDB API                                  │
│  POST /api/admin/movies/sync-tmdb                                  │
│  └─> Creates Movie documents with isActive=true                   │
│  └─> Movies stored globally with tmdbId (no duplicates)           │
│                                                                      │
│  Step 2: MANAGER SELECTS & CREATES SHOWS                          │
│  ────────────────────────────────────────                          │
│  Manager views available active movies                             │
│  GET /api/manager/movies/available                                 │
│  └─> Returns all isActive=true movies                              │
│                                                                      │
│  Manager creates show for selected movie                           │
│  POST /api/manager/shows/add                                       │
│  ├─> Validates movie is active                                     │
│  ├─> Validates screen belongs to their theatre                     │
│  ├─> Auto-generates seatTiers (Standard + Premium)                │
│  └─> Creates Show document with basePrice & language              │
│                                                                      │
│  Step 3: CUSTOMER BROWSES & BOOKS                                 │
│  ────────────────────────────────────                             │
│  Customer views available movies                                   │
│  GET /api/show/movies-available                                    │
│  └─> Returns movies with future shows scheduled                    │
│                                                                      │
│  Customer sees shows by theatre/screen                             │
│  GET /api/show/by-movie/:movieId                                   │
│  └─> Returns grouped: theatres → screens → shows                  │
│                                                                      │
│  Customer selects theatre, screen, date and books                 │
│  POST /api/booking/create                                          │
│  └─> Reserves seats and creates booking                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Database Models & Relationships

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password_hash: String,
  role: "customer" | "admin" | "manager",  // Role-based access
  managedTheaterId: ObjectId,              // Only for managers
  favorites: [ObjectId],                   // Movie references
}
```

### Movie Model
```javascript
{
  _id: ObjectId,
  title: String,
  overview: String,
  poster_path: String,
  backdrop_path: String,
  release_date: Date,
  original_language: String,
  genres: Array,
  vote_average: Number,
  runtime: Number,
  
  // API Management
  tmdbId: Number,                           // Unique index from TMDB
  isActive: Boolean,                        // Soft delete flag
  addedByAdmin: ObjectId ref User,          // Which admin added it
  theatres: [ObjectId ref Theatre],         // Which theatres show it
}
```

### Theatre Model
```javascript
{
  _id: ObjectId,
  name: String,
  location: String,
  city: String,
  manager: ObjectId ref User,               // Theatre manager
  screens: [ObjectId ref Screen],           // Associated screens
  movies: [ObjectId ref Movie],             // Movies showing here
}
```

### Screen Model
```javascript
{
  _id: ObjectId,
  screenName: String,
  theatre: ObjectId ref Theatre,
  seatsPerRow: Number,
  rows: Number,
}
```

### Show Model
```javascript
{
  _id: ObjectId,
  movie: ObjectId ref Movie,
  theatre: ObjectId ref Theatre,
  screen: ObjectId ref Screen,
  showDateTime: Date,
  basePrice: Number,
  language: String,
  
  // Dynamic Pricing Tiers
  seatTiers: [{
    tierName: String,          // "Standard", "Premium"
    price: Number,             // basePrice * multiplier
    seatsPerRow: Number,       // 20 for Standard, 5 for Premium
    rowCount: Number,          // 10 for Standard, 2 for Premium
    totalSeats: Number,        // Calculated (seatsPerRow * rowCount)
    occupiedSeats: Object,     // { "A1": userId, "B5": userId }
  }],
  
  totalCapacity: Number,       // Sum of all seat tiers
  occupiedSeatsCount: Number,  // Current occupancy
  isActive: Boolean,
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  user: ObjectId ref User,
  show: ObjectId ref Show,
  seats: [String],            // ["A1", "A2", "B3"]
  numberOfTickets: Number,
  totalAmount: Number,
  paymentStatus: "pending" | "completed" | "failed",
  bookingDate: Date,
}
```

## 3. API Endpoints by Role

### ADMIN ENDPOINTS

#### Movie Management
```bash
# Sync movies from TMDB API (with pagination & search)
POST /api/admin/movies/sync-tmdb
Request: { page: 1, searchQuery: "Avengers" }
Response: { success, message, moviesAdded, totalResults, totalPages }

# Get all movies (admin view with metadata)
GET /api/admin/movies
Response: { success, movies: [ {...movie with addedByAdmin, theatres} ] }

# Get specific movie details
GET /api/admin/movies/:movieId
Response: { success, movie: {...} }

# Get available active movies for managers
GET /api/admin/movies/available
Response: { success, movies: [ {...} ] }

# Deactivate movie (soft delete)
PUT /api/admin/movies/:movieId/deactivate
Response: { success, message, movie: {...isActive: false} }

# Update movie details
PUT /api/admin/movies/:movieId
Request: { title, overview, genres, etc. }
Response: { success, message, movie: {...} }
```
#### Theatre Management
```bash
GET /api/admin/theatres
GET /api/admin/theatres/:theatreId
POST /api/admin/theatres
PUT /api/admin/theatres/:theatreId
DELETE /api/admin/theatres/:theatreId
GET /api/admin/payments/:theatreId
```

### MANAGER ENDPOINTS

#### Movie Selection
```bash
# Get available active movies (to choose from for shows)
GET /api/manager/movies/available
Response: { success, movies: [{_id, title, poster_path, release_date, ...}] }
```

#### Screen Management
```bash
# Get screens for manager's theatre
GET /api/manager/screens
Response: { success, screens: [{_id, screenName, seatsPerRow, rows}] }

POST /api/manager/screens/add
PUT /api/manager/screens/:screenId
DELETE /api/manager/screens/:screenId
```

#### Show Management
```bash
# Get all shows for manager's theatre (with status filter)
GET /api/manager/shows?status=upcoming
Response: { success, shows: [{...show with movie, screen details}] }

# Add new show (manager creates show from selected movie)
POST /api/manager/shows/add
Request: {
  movieId: ObjectId,
  screenId: ObjectId,
  showDateTime: "2024-01-15T14:00:00Z",
  basePrice: 150,
  language: "en"
}
Response: {
  success,
  message,
  show: {
    _id, movie, theater, screen, showDateTime,
    basePrice, language,
    seatTiers: [{tierName, price, totalSeats, ...}],
    totalCapacity
  }
}

# Edit show details
PUT /api/manager/shows/:showId
Request: { showDateTime, basePrice, language }

# Delete show
DELETE /api/manager/shows/:showId
```

#### Dashboard
```bash
GET /api/manager/dashboard
Response: { 
  success,
  totalShows,
  upcomingShows,
  bookingsThisMonth,
  revenueThisMonth,
  recentBookings: [...]
}
```

#### Bookings
```bash
GET /api/manager/bookings
Response: { success, bookings: [{user, show, seats, totalAmount, status}] }
```

### PUBLIC CUSTOMER ENDPOINTS

#### Browse Movies & Shows
```bash
# Get all available movies with future shows
GET /api/show/movies-available
Response: {
  success,
  movies: [{_id, title, poster_path, release_date, ...}],
  count
}

# Get shows for movie grouped by theatre/screen
GET /api/show/by-movie/:movieId
Response: {
  success,
  groupedShows: {
    "theatreId1": {
      theater: {...},
      screens: {
        "screenId1": {
          screen: {...},
          shows: [{_id, showDateTime, basePrice, seatTiers, ...}]
        }
      }
    }
  }
}

# Get specific show details
GET /api/show/show/:showId
Response: { success, show: {...} }
```

#### Booking (existing)
```bash
POST /api/booking/create
GET /api/booking/user-bookings
```

## 4. Controller Functions Overview

### adminMovieController.js
- `syncMoviesFromTMDB` - Fetch from TMDB API with pagination
- `getAllMovies` - Admin view of all movies
- `getAllAvailableMovies` - Active movies for managers
- `getMovieById` - Specific movie details
- `deactivateMovie` - Soft delete
- `updateMovie` - Edit movie info

### managerShowController.js
- `getAvailableMovies` - Active movies for show creation
- `getTheatreScreens` - Screens for manager's theatre only
- `addShow` - Create new show with auto-tier pricing
- `getTheatreShows` - List manager's shows with status filter
- `editShow` - Update show details
- `deleteShow` - Remove show
- `dashboardManagerData` - Statistics overview

### showController.js (Public Endpoints)
- `getAvailableMoviesForCustomers` - Movies with future shows
- `fetchShowsByMovie` - Shows grouped by theatre/screen
- `fetchShow` - Individual show details
- (And existing functions...)

## 5. Middleware & Access Control

### protectAdminOnly
- Validates user.role === "admin"
- Applied to all `/api/admin/*` routes

### protectManager
- Validates user.role === "manager"
- Validates user.managedTheaterId is set
- Applied to all `/api/manager/*` routes

### Theatre Isolation
- Managers can only access their assigned theatre (via managedTheaterId)
- Screen queries filtered: `Screen.find({ theater: managedTheaterId })`
- Show queries filtered: `Show.find({ theater: managedTheaterId })`

## 6. Frontend Integration Paths

### Admin Dashboard `/admin`
1. `/admin/movies` - Sync movies from TMDB, view, manage
2. `/admin/theatres` - View/edit/delete theatres
3. `/admin/payments/:theatreId` - Revenue tracking

### Manager Dashboard `/manager`
1. `/manager/shows` - List upcoming/past shows
2. `/manager/add-show` - Create new show form
3. `/manager/screens` - Manage screens
4. `/manager/bookings` - View bookings

### Customer `/buy-tickets/:movieId`
1. Shows available shows by theatre/screen/date
2. Seat selection interface
3. Booking confirmation

## 7. Implementation Checklist

### Backend ✅ COMPLETE
- [x] User model with role & managedTheaterId
- [x] Movie model with tmdbId, isActive, addedByAdmin, theatres
- [x] Theater model with manager & movies fields
- [x] Show model with basePrice, language, seatTiers
- [x] Middleware: protectAdminOnly, protectManager
- [x] Admin routes registered (movie management)
- [x] Manager routes registered (show management)
- [x] Admin movie controller (TMDB sync + CRUD)
- [x] Manager show controller (CRUD with validation)
- [x] Public show endpoints for customers

### Frontend Integration ⏳ NEXT PHASE
- [ ] AdminMovies component (sync form, movie table)
- [ ] ManagerAddShow component (form with dropdowns)
- [ ] ManagerShows component (list with edit/delete)
- [ ] Update BuyTicketsFlow with new API endpoints
- [ ] Test complete workflow end-to-end

### Environment Setup ⏳ TODO
- [ ] Add TMDB_API_KEY to server/.env
- [ ] Test TMDB API connection
- [ ] Create test admin user (role: "admin")
- [ ] Create test manager user (role: "manager", managedTheaterId)
- [ ] Seed test data (theatres, screens, movies)

## 8. API Testing Commands

### Admin: Sync Movies from TMDB
```bash
curl -X POST http://localhost:3000/api/admin/movies/sync-tmdb \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{ "page": 1, "searchQuery": "" }'
```

### Manager: Add Show
```bash
curl -X POST http://localhost:3000/api/manager/shows/add \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": "movie_id_from_sync",
    "screenId": "screen_id",
    "showDateTime": "2024-01-15T14:00:00Z",
    "basePrice": 150,
    "language": "en"
  }'
```

### Customer: Get Movies
```bash
curl http://localhost:3000/api/show/movies-available
```

### Customer: Get Shows for Movie
```bash
curl http://localhost:3000/api/show/by-movie/movie_id
```

## 9. Key Features

### Automatic Pricing Tiers
When a manager creates a show with basePrice = 150:
- **Standard Seats**: 200 seats (20 rows × 10 cols) @ 150
- **Premium Seats**: 10 seats (2 rows × 5 cols) @ 225 (1.5× basePrice)

### No Duplicate Movies
TMDB movies tracked by unique `tmdbId` - prevents duplicate syncs

### Theatre Isolation
Managers use `managedTheaterId` to ensure they only see/modify their theatre's data

### Role-Based Access
- Admin: Global movie management
- Manager: Theatre-specific show management
- Customer: Browse & book shows

### Soft Deletes
`isActive` flag allows data recovery and audit trails

## 10. Next Steps

1. **Environment Setup**
   - Configure TMDB_API_KEY in server/.env
   - Verify MongoDB connection

2. **Frontend Components**
   - Create AdminMovies page to call `/api/admin/movies/sync-tmdb`
   - Create ManagerAddShow form for `/api/manager/shows/add`
   - Connect BuyTicketsFlow to new endpoints

3. **Testing**
   - Test admin movie sync with real TMDB data
   - Test manager show creation workflow
   - Test customer booking flow end-to-end

4. **Database Seeding**
   - Create test users (admin, manager, customer)
   - Create test theatres with manager assignment
   - Create test screens

## 11. Troubleshooting

### "TMDB API key not configured"
- Add `TMDB_API_KEY=your_key` to server/.env
- Get key from: https://www.themoviedb.org/settings/api

### "Unauthorized - Manager access required"
- Ensure token bearer contains user with role="manager"
- Ensure managedTheaterId is set in user document

### "Screen not found for this theatre"
- Verify screen's theatre field matches managedTheaterId
- Check screen was created with correct theatre reference

### "Movie not found or is inactive"
- Admin must sync the movie first: POST /api/admin/movies/sync-tmdb
- Verify movie has isActive=true after sync

## 12. Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  TMDB API                                                     │
│      ↓                                                        │
│  Admin Route                                                  │
│  POST /api/admin/movies/sync-tmdb                            │
│      ↓                                                        │
│  adminMovieController.syncMoviesFromTMDB()                   │
│      ↓                                                        │
│  Movie Collection (isActive=true, tmdbId unique)             │
│      ↓                                                        │
│  Manager Route                                               │
│  GET /api/manager/movies/available                           │
│      ↓                                                        │
│  managerShowController.getAvailableMovies()                  │
│      ↓                                                        │
│  Manager sees movies & creates shows                         │
│  POST /api/manager/shows/add                                 │
│      ↓                                                        │
│  managerShowController.addShow()                             │
│      ↓                                                        │
│  Show Collection (with seatTiers, theatre validation)        │
│      ↓                                                        │
│  Customer Route                                              │
│  GET /api/show/movies-available                              │
│  GET /api/show/by-movie/:movieId                             │
│      ↓                                                        │
│  showController.getAvailableMoviesForCustomers()             │
│  showController.fetchShowsByMovie()                          │
│      ↓                                                        │
│  Customer sees shows grouped by theatre/screen               │
│  POST /api/booking/create                                    │
│      ↓                                                        │
│  Booking Collection (with seat reservations)                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

**Implementation Status**: ✅ BACKEND COMPLETE - READY FOR FRONTEND INTEGRATION
**Last Updated**: 2024
**Version**: 1.0
