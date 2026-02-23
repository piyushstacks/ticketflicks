# New Schema Migration Guide

## Overview
The new normalized database schema is now available alongside the old schema.

## API Endpoints

### New Schema Routes (mounted at `/api/v2`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/users/register` | POST | Register new user |
| `/api/v2/users/login` | POST | Login user |
| `/api/v2/users` | GET | Get all users |
| `/api/v2/users/:userId` | GET/PUT/DELETE | User CRUD |
| `/api/v2/theaters` | GET/POST | Theater CRUD |
| `/api/v2/theaters/:theaterId` | GET/PUT/DELETE | Theater operations |
| `/api/v2/screens` | GET/POST | Screen CRUD |
| `/api/v2/screens/:screenId` | GET/PUT/DELETE | Screen operations |
| `/api/v2/movies` | GET/POST | Movie CRUD |
| `/api/v2/movies/:movieId` | GET/PUT/DELETE | Movie operations |
| `/api/v2/movies/tmdb/now-playing` | GET | Fetch TMDB movies |
| `/api/v2/movies/tmdb/import/:tmdbId` | POST | Import from TMDB |
| `/api/v2/shows` | GET/POST | Show CRUD |
| `/api/v2/shows/:showId` | GET/PUT/DELETE | Show operations |
| `/api/v2/shows/movie/:movieId` | GET | Shows by movie |
| `/api/v2/bookings` | GET/POST | Booking CRUD |
| `/api/v2/bookings/:bookingId` | GET/PUT/DELETE | Booking operations |
| `/api/v2/bookings/user/:userId` | GET | User bookings |
| `/api/v2/bookings/payment/stripe` | POST | Create Stripe payment |
| `/api/v2/seat-categories` | GET/POST | Seat category CRUD |
| `/api/v2/seats` | GET/POST | Seat CRUD |
| `/api/v2/genres` | GET/POST | Genre CRUD |
| `/api/v2/languages` | GET/POST | Language CRUD |
| `/api/v2/cast` | GET/POST | Cast CRUD |
| `/api/v2/reviews` | GET/POST | Review CRUD |
| `/api/v2/payments` | GET/POST | Payment CRUD |

## Data Migration

### Step 1: Backup your database
```bash
mongodump --uri="your_mongodb_uri" --out=backup_$(date +%Y%m%d)
```

### Step 2: Run the migration script
```bash
cd server
node scripts/migrateToNewSchema.js
```

This will:
1. Migrate Users → `users` collection
2. Migrate Theatres → `theaters` collection  
3. Extract and create Genres, Languages, Cast
4. Migrate Movies with references → `movies` collection
5. Migrate Screens → `screens` collection
6. Create Seat Categories and Seats
7. Migrate Shows → `shows` collection
8. Migrate Bookings → `bookings` collection
9. Create Payment records

### Step 3: Verify migration
Check the console output for:
- ✅ Migrated X users
- ✅ Migrated X theaters
- ✅ Migrated X movies
- ✅ Migrated X shows
- ✅ Migrated X bookings

### Step 4: Switch to new routes
Update your frontend to use `/api/v2` endpoints instead of `/api/show`, `/api/booking`, etc.

## Schema Differences

### Old Schema (Denormalized)
- Shows had embedded `seatTiers` with `occupiedSeats` object
- Bookings had embedded `bookedSeats` array
- Single collection for everything

### New Schema (Normalized)
- **SeatCategory** - Separate table for pricing tiers
- **Seat** - Separate table with references to Screen and Category
- **Show** - References Movie, Theater, Screen, available_seats array
- **Booking** - References Show, User, seats_booked array of Seat IDs
- **Payment** - Separate table for all payment records

## Collection Mapping

| Old Collection | New Collection(s) |
|----------------|-------------------|
| `users` | `users` (same) |
| `theatres` | `theaters` |
| `movie_tbls` | `movies`, `genres`, `languages`, `casts` |
| `screentbls` | `screens` |
| `show_tbls` | `shows`, `seat_categories`, `seats` |
| `bookings` | `bookings`, `payments` |

## Rollback Plan

If you need to rollback:
1. Stop the server
2. Drop new collections: `genres`, `languages`, `casts`, `screens`, `theaters`, `seat_categories`, `seats`, `shows`, `bookings`, `payments`, `ratings_reviews`
3. Restart with old routes only
