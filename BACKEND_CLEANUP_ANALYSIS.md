# Backend Cleanup & Restructuring Analysis

## Current Status
- **Schema Version**: Using "new schema" (users_new, movies_new, shows_new, bookings_new, theatres)
- **Old Schema**: Partially commented out, creating confusion
- **Route Management**: Multiple overlapping routes (old, new, v2 versions)

## Critical Issues Identified

### 1. **Data Model Inconsistencies**

#### User Model Issues:
- ✗ No `managedTheatreId` field defined in schema but referenced in controllers
- ✗ No `favorites` array defined in schema but used in userController
- ✗ Missing proper validation for phone numbers in some contexts
- ✓ Password hashing properly configured

#### Movie Model Issues:
- ✗ `genre_ids` and `language_id` are arrays of ObjectIds but never populated with actual data
- ✗ Missing runtime field (using duration_min inconsistently)
- ✗ Cast references not being used/populated
- ✗ No rating/review relationship explicitly defined

#### Show Model Issues:
- ✗ Inconsistent field naming (showDateTime vs showTime)
- ✗ seatTiers structure differs from Screen model's seatTiers
- ✗ occupiedSeats tracking is complex and error-prone
- ✗ Missing proper status fields
- ✗ No cancellation support

#### Booking Model Issues:
- ✗ seats_booked references Seat model that doesn't exist
- ✗ No clear payment status tracking (both status and isPaid)
- ✗ Missing cancellation_reason field
- ✗ No refund tracking
- ✗ payment_link stored but no payment history

#### Theatre Model Issues:
- ✗ Uses `manager_id` but User model has no reference back
- ✗ PDF storage approach is problematic
- ✓ Approval workflow exists but needs consistency

### 2. **Controller Issues**

#### authController.js
- ✓ Basic auth flow correct
- ✗ No input sanitization
- ✗ OTP verification missing proper error messages
- ✗ No rate limiting on login attempts

#### bookingController.js
- ✗ Complex seat availability logic with tier support but inconsistent
- ✗ Stripe integration tightly coupled
- ✗ No transaction handling for concurrent bookings
- ✗ Seat locking mechanism is fragile
- ✗ Currency conversion hardcoded

#### adminController.js
- ✗ Theatre approval duplicates code from theatreController
- ✗ Dashboard data doesn't filter deleted/disabled records
- ✗ No pagination on queries
- ✗ Missing input validation

#### theatreController.js
- ✓ Theatre registration OTP flow good
- ✗ Screen creation mixed with theatre registration
- ✗ No proper error handling for duplicate registrations
- ✗ Manager creation inside theatre controller instead of separate service

#### userController.js
- ✗ Favorites not defined in User schema
- ✗ bookingController.fetchUserBookings uses wrong field: `user` instead of `user_id`
- ✗ Profile updates don't validate email format
- ✗ No phone validation

### 3. **Route & API Consistency Issues**

Routes are scattered and duplicated:
```
Old: /api/show, /api/booking, /api/user, /api/theatre
New: /api/v2 (newSchemaRoutes)
Current: Default to /api/show, /api/booking, /api/user, /api/theatre using newSchemaRouter
```

Issues:
- ✗ `/api/theatre` uses old theatreController mixed with new schema
- ✗ `/api/search` uses old showController
- ✗ `/api/admin` and `/api/manager` have overlapping functionality
- ✗ No versioning strategy clear

### 4. **Data Integrity Problems**

- ✗ No soft delete consistent pattern
- ✗ Cascade delete not handled
- ✗ Orphaned records possible
- ✗ No transaction support for multi-model operations
- ✗ Race conditions in seat booking

### 5. **Error Handling**

- ✗ Inconsistent error response formats
- ✗ No centralized error handler
- ✗ Missing try-catch in some places
- ✗ Generic error messages leak to frontend
- ✗ No logging strategy

### 6. **Validation & Security**

- ✗ No input sanitization on most endpoints
- ✗ Email validation only on signup, not update
- ✗ Phone validation inconsistent
- ✗ No CORS origin validation
- ✗ No rate limiting except OTP
- ✗ No SQL injection protection (though using MongoDB)

### 7. **Code Structure Issues**

- ✗ Controllers are too large (600+ lines)
- ✗ Business logic mixed with route handling
- ✗ No service layer for reusable logic
- ✗ No repository/data access layer
- ✗ Circular dependencies possible

---

## Cleanup Plan

### Phase 1: Fix Data Models
1. ✓ Add missing fields to User (managedTheatreId, favorites)
2. ✓ Fix foreign key references in all models
3. ✓ Remove unused fields
4. ✓ Add consistent indexing
5. ✓ Add data validation

### Phase 2: Create Service Layer
1. Create `services/` folder with:
   - `authService.js` - Auth logic
   - `bookingService.js` - Booking logic
   - `theatreService.js` - Theatre logic
   - `movieService.js` - Movie logic
   - `seatService.js` - Seat availability
   - `paymentService.js` - Payment handling

### Phase 3: Refactor Controllers
1. Break down large controllers
2. Remove business logic, keep only request/response
3. Add proper error handling
4. Add input validation

### Phase 4: Standardize Routes
1. Consolidate to single version
2. Use consistent naming
3. Add proper middleware
4. Remove duplicate endpoints

### Phase 5: Add Utilities
1. Error handler middleware
2. Request logger
3. Input validator
4. Response formatter
5. Rate limiter

### Phase 6: Database Consistency
1. Fix all relationships
2. Add cascade delete where needed
3. Add soft delete consistently
4. Fix orphaned data

---

## Success Criteria

- [ ] All endpoints return consistent response format
- [ ] No broken references between models
- [ ] Proper error messages with status codes
- [ ] 100% input validation
- [ ] Duplicate code eliminated
- [ ] Services handle business logic
- [ ] Controllers only handle HTTP
- [ ] All database operations use correct fields
- [ ] No console.log in production code
- [ ] Proper async/await usage throughout
