# Updated API Implementation - Admin Movie Management & Manager Shows

## Changes Made

### 1. Fixed Theatre Listing in Admin Portal ✅

**Issue**: Theatres were stored in `theatre_tbls` using the `Theatre` model, but the admin controller was querying `theater_tbls` using the `Theater` model.

**Solution**: Updated `adminController.js` to use the `Theatre` model for all theatre-related operations.

**Updated Functions**:
- `getAllTheatres()` - Now queries Theatre model
- `getTheatreDetails()` - Now queries Theatre model with `manager_id` field
- `dashboardAdminData()` - Counts from Theatre model
- `createTheatre()` - Creates using Theatre model schema (name, location, contact_no, manager_id)
- `updateTheatre()` - Updates using Theatre model
- `deleteTheatre()` - Deletes from Theatre model

---

### 2. Admin Multi-Movie Selection for Theatres ✅

**New Feature**: Admin can now select and assign multiple movies to a theatre at once.

**New Endpoints**:

```bash
# Assign multiple movies to theatre
POST /api/admin/theatres/:theatreId/assign-movies
Request: {
  "theatreId": "theatre_id",
  "movieIds": ["movie_id_1", "movie_id_2", "movie_id_3"]
}
Response: {
  success: true,
  message: "3 movies assigned to theatre successfully",
  theatre: {...}
}

# Remove multiple movies from theatre
POST /api/admin/theatres/:theatreId/remove-movies
Request: {
  "theatreId": "theatre_id",
  "movieIds": ["movie_id_1", "movie_id_2"]
}
Response: {
  success: true,
  message: "2 movies removed from theatre successfully",
  theatre: {...}
}
```

**New Controller Functions in adminMovieController.js**:
- `assignMoviesToTheatre()` - Assigns multiple movies to a theatre
- `removeMoviesFromTheatre()` - Removes multiple movies from a theatre

**How it Works**:
1. Validates admin role
2. Verifies theatre exists
3. Verifies all movie IDs exist
4. Adds movie IDs to theatre.movies array (avoids duplicates)
5. Updates each Movie document to include theatre in movies.theatres array
6. Returns updated theatre with populated movies

---

### 3. Simplified Manager Show Creation ✅

**Change**: Removed basePrice and showDateTime from manager input - now uses sensible defaults.

**Updated Endpoint**:

```bash
# Add show - SIMPLIFIED (no basePrice input)
POST /api/manager/shows/add
OLD Request: {
  "movieId": "...",
  "screenId": "...",
  "showDateTime": "...",
  "basePrice": 150,           ❌ REMOVED
  "language": "en"
}

NEW Request: {
  "movieId": "...",
  "screenId": "...",
  "showDateTime": "...",
  "language": "en"
}

Response: {
  success: true,
  show: {
    _id,
    movie: {...},
    theater: theatreId,
    screen: {...},
    showDateTime,
    basePrice: 150,            ✅ Default value
    language: "en",
    seatTiers: [
      {
        tierName: "Standard",
        price: 150,
        seatsPerRow: 20,
        rowCount: 10,
        totalSeats: 200
      },
      {
        tierName: "Premium",
        price: 225,              ✅ Auto-calculated (150 * 1.5)
        seatsPerRow: 5,
        rowCount: 2,
        totalSeats: 10
      }
    ]
  }
}
```

**Changes in managerShowController.js**:
- `addShow()` now uses default basePrice of 150 instead of requiring it from request
- Removed basePrice validation from required fields
- Auto-calculates Premium tier pricing (1.5× base)
- Simplifies manager UI form

---

## Complete Workflow Overview

```
ADMIN WORKFLOW:
1. Sync movies from TMDB
   POST /api/admin/movies/sync-tmdb

2. View all movies
   GET /api/admin/movies

3. View theatres
   GET /api/admin/theatres

4. Assign multiple movies to theatre
   POST /api/admin/theatres/:theatreId/assign-movies
   Body: { movieIds: ["id1", "id2", "id3"] }

5. View theatre with assigned movies
   GET /api/admin/theatres/:theatreId

-----

MANAGER WORKFLOW:
1. View available movies for their theatre
   GET /api/manager/movies/available

2. View screens in their theatre
   GET /api/manager/screens

3. Create show (simplified - no price/time input needed in form)
   POST /api/manager/shows/add
   Body: {
     movieId,
     screenId,
     showDateTime,
     language: "en"
   }

4. View shows
   GET /api/manager/shows

5. Edit show times
   PUT /api/manager/shows/:showId

-----

CUSTOMER WORKFLOW:
1. View available movies
   GET /api/show/movies-available

2. See shows by theatre/screen/date
   GET /api/show/by-movie/:movieId

3. Book tickets
   POST /api/booking/create
```

---

## Updated Routes

### Admin Routes - `/api/admin`

```javascript
// Theatre Management
GET    /theatres                          // List all theatres
GET    /theatres/:theatreId               // Get theatre details
POST   /theatres                          // Create theatre
PUT    /theatres/:theatreId               // Update theatre
DELETE /theatres/:theatreId               // Delete theatre

// Movie-Theatre Assignment (NEW)
POST   /theatres/:theatreId/assign-movies   // Assign movies to theatre
POST   /theatres/:theatreId/remove-movies   // Remove movies from theatre

// Movie Management
POST   /movies/sync-tmdb                  // Sync from TMDB API
GET    /movies                            // Get all movies
GET    /movies/available                  // Get active movies
GET    /movies/:movieId                   // Get movie details
PUT    /movies/:movieId/deactivate        // Deactivate movie
PUT    /movies/:movieId                   // Update movie
```

### Manager Routes - `/api/manager`

```javascript
// Movie Selection (View assigned movies)
GET    /movies/available                  // Get movies for their theatre

// Screen Management
GET    /screens                           // Get screens in their theatre
POST   /screens/add                       // Add screen
PUT    /screens/:screenId                 // Update screen
DELETE /screens/:screenId                 // Delete screen

// Show Management
GET    /shows                             // List theatre shows
POST   /shows/add                         // Create show (SIMPLIFIED)
PUT    /shows/:showId                     // Edit show
DELETE /shows/:showId                     // Delete show

// Dashboard & Bookings
GET    /dashboard                         // Manager stats
GET    /bookings                          // View bookings
```

---

## Database Model Changes

### Theatre Model Usage
```javascript
// Schema matches theatre_tbls
{
  name: String,
  location: String,
  manager_id: ObjectId ref User,    // Theatre manager
  contact_no: String,
  screens: [{...}],                 // Embedded screens
}
```

### Movie-Theatre Relationship
```javascript
// Movie Document
{
  title: String,
  theatres: [ObjectId],             // Which theatres show this
  isActive: Boolean
}

// Theatre Document (if using Theater model)
{
  movies: [ObjectId]                // Movies showing here
}
```

---

## Testing Checklist

- [ ] Admin can view all theatres from the portal
- [ ] Admin can sync movies from TMDB API
- [ ] Admin can select multiple movies from list
- [ ] Admin can assign selected movies to a theatre
- [ ] Admin can remove movies from a theatre
- [ ] Theatre shows all assigned movies in detail view
- [ ] Manager sees available movies (assigned to their theatre)
- [ ] Manager can create show without price input
- [ ] Show defaults to basePrice = 150
- [ ] Premium tier auto-calculates to 225 (150 * 1.5)
- [ ] Seat tiers are correctly populated on show creation
- [ ] Customer sees shows grouped by theatre/screen on buy-tickets page

---

## Frontend Integration (Next Steps)

### Admin Pages to Update:
1. **AdminTheatres.jsx**
   - Add button "Assign Movies" on each theatre row
   - Show modal with multi-select movie picker
   - Display assigned movies on theatre details

2. **AdminMovies.jsx** (if exists)
   - Show sync status and results
   - Display movies in table/grid

### Manager Pages to Update:
1. **ManagerAddShow.jsx**
   - Remove basePrice input field
   - Remove show time input (manager selects date/time in different way)
   - Simplified form: movieId dropdown, screenId dropdown, datetime picker, language

2. **ManagerShows.jsx**
   - Display shows with auto-calculated pricing
   - Edit functionality for showDateTime only (not price)

---

## API Testing Examples

### Test 1: Assign Movies to Theatre
```bash
curl -X POST http://localhost:3000/api/admin/theatres/theatre_id/assign-movies \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "theatreId": "theatre_id",
    "movieIds": ["movie_id_1", "movie_id_2", "movie_id_3"]
  }'
```

### Test 2: Create Show (Simplified)
```bash
curl -X POST http://localhost:3000/api/manager/shows/add \
  -H "Authorization: Bearer manager_token" \
  -H "Content-Type: application/json" \
  -d '{
    "movieId": "movie_id",
    "screenId": "screen_id",
    "showDateTime": "2024-01-20T14:00:00Z",
    "language": "en"
  }'
```

### Test 3: View Theatre (with movies)
```bash
curl -X GET http://localhost:3000/api/admin/theatres/theatre_id \
  -H "Authorization: Bearer admin_token"
```

---

## Summary of Improvements

| Feature | Before | After |
|---------|--------|-------|
| Theatre View | Not showing (wrong model) | ✅ Shows all theatres |
| Movie Assignment | Manual per movie | ✅ Multi-select bulk assign |
| Show Creation | Required price input | ✅ Simplified, auto-defaults |
| Pricing | Manual entry | ✅ Auto-calculated tiers |
| Manager Workflow | Complex form | ✅ Simplified, fewer inputs |

---

**Implementation Status**: ✅ COMPLETE - Ready for Frontend Integration
