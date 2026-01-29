# Seat Booking System - Complete Fix Documentation

## 📋 Overview

This document outlines all fixes implemented for the seat booking system, including issues with seat selection, pricing, layout display, and the complete data flow.

---

## 🐛 Issues Identified

### 1. **Same Seat Layout for All Movies**
- **Problem**: Every movie booking showed the same seat layout regardless of which screen/show was selected
- **Root Cause**: Multiple issues:
  - Old screens existed only as embedded documents in `Theatre.screens` array
  - Shows were referencing `ScreenTbl` documents that didn't exist in the collection
  - Frontend wasn't properly reading from the correct data source

### 2. **Incorrect Pricing**
- **Problem**: All seats showed default hardcoded prices (₹150, ₹200, etc.) instead of manager-configured prices
- **Root Cause**: Frontend was using `SEAT_TIERS` constant base prices instead of actual prices from `show.seatTiers` or `screen.seatTiers`

### 3. **Seat Selection Issues**
- **Problem**: Same seat could be selected multiple times, seats showed as invalid after selection
- **Root Cause**: Using arrays instead of Sets for seat tracking, causing O(n) lookups and duplicate issues

### 4. **Empty Seat Layouts**
- **Problem**: Some screens in database had `seatLayout.layout = []` (empty array)
- **Root Cause**: Data migration issue when transitioning from embedded theatre.screens to ScreenTbl collection

---

## ✅ Solutions Implemented

### 1. Backend Fixes

#### A. `managerScreenTblController.js`

**Added `convertPricingToSeatTiers()` function:**
```javascript
// Converts pricing object from frontend to seatTiers array for database
// Handles both:
// - Unified pricing: { unified: 200 }
// - Tier-based pricing: { S: { price: 150 }, P: { price: 250 } }
```

**Key changes:**
- Maps seat codes (S, D, P, R, C) to tier names (Standard, Deluxe, Premium, Recliner, Couple)
- Automatically determines which rows contain which seat types from the layout
- Converts pricing to the format expected by Show and ScreenTbl models

#### B. Updated Screen Creation/Edit Endpoints

**In `addScreenTbl` and `editScreenTbl`:**
- Now accepts `pricing` object from frontend
- Converts it to `seatTiers` array before saving
- Ensures all screen documents have proper pricing information

### 2. Frontend Fixes

#### A. `SeatLayout_New.jsx` - Complete Rewrite

**Data Flow:**
1. Fetches show from `/api/show/show/:showId`
2. Builds `tierPricingMap` from available sources (in priority order):
   - `show.seatTiers` (primary)
   - `show.screen.seatTiers` (secondary)
   - `show.theatre.screens[matching].pricing` (fallback for old data)
   - `SEAT_TIERS` constants (last resort)

3. Gets seat layout from available sources (in priority order):
   - `show.screen.seatLayout.layout` (primary)
   - `show.theatre.screens[matching].layout` (fallback for old data)

**State Management:**
- Changed from arrays to `Set` objects for O(1) lookups:
  - `selectedSeats` → `Set<string>`
  - `occupiedSeats` → `Set<string>`
  - `lockedSeats` → `Set<string>` (new - tracks seats being booked by others)

**Key Features:**
```javascript
// Real-time pricing from show/screen
const tierPricingMap = useMemo(() => {
  // Builds map: { S: { name, price, color }, P: { name, price, color }, ... }
}, [show]);

// Fallback for empty layouts
const seatLayout = useMemo(() => {
  // Try ScreenTbl first, then embedded theatre.screens
}, [show]);

// Get actual seat tier info
const getSeatTierInfo = useCallback((seatNumber) => {
  const code = getSeatCodeFromLayout(seatNumber);
  const tierInfo = tierPricingMap[code]; // Uses actual prices!
  return { tierName, price, color, code };
}, [tierPricingMap]);
```

**New Features:**
- ✅ Auto-refresh occupied seats every 30 seconds
- ✅ Manual refresh button
- ✅ Locked seat indicator (yellow pulsing dot)
- ✅ Price breakdown by tier
- ✅ Real-time total calculation
- ✅ Max 10 seats selection
- ✅ Click selected seat to deselect
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

#### B. `MovieDetails.jsx`

**Fixed navigation URL:**
```javascript
// Before (WRONG):
navigate(`/seat-layout/${showItem._id}/${date}`);

// After (CORRECT):
navigate(`/seat-layout/${showItem._id}`);
```

#### C. Route Configuration (`App.jsx`)

**Two routes available:**
- `/movies/:id/:date` → `SeatLayout` (old, kept for backward compatibility)
- `/seat-layout/:showId` → `SeatLayoutNew` ✅ (recommended, current)

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Manager Creates Screen                                          │
│                                                                 │
│ ScreenConfiguration.jsx                                        │
│   ↓                                                            │
│ Sends: { pricing: { S: {price: 150}, P: {price: 250} } }     │
│   ↓                                                            │
│ managerScreenTblController.addScreenTbl()                     │
│   ↓                                                            │
│ convertPricingToSeatTiers()                                   │
│   ↓                                                            │
│ Saves: seatTiers: [                                           │
│   { tierName: "Standard", price: 150, rows: ["A","B"] },     │
│   { tierName: "Premium", price: 250, rows: ["C","D"] }       │
│ ]                                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Manager Creates Show                                            │
│                                                                 │
│ managerShowController.addShow()                                │
│   ↓                                                            │
│ Copies seatTiers from ScreenTbl to Show document              │
│   ↓                                                            │
│ Show.seatTiers = screenDoc.seatTiers                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ User Books Seats                                                │
│                                                                 │
│ SeatLayout_New.jsx                                             │
│   ↓                                                            │
│ GET /api/show/show/:showId                                     │
│   ↓ Returns: { show, show.seatTiers, show.screen.seatLayout } │
│                                                                 │
│ Build tierPricingMap from show.seatTiers                       │
│   { S: {name: "Standard", price: 150}, ... }                  │
│                                                                 │
│ Display seats with actual prices                               │
│   ↓                                                            │
│ User selects seats                                             │
│   ↓                                                            │
│ Calculate total using actual prices                            │
│   ↓                                                            │
│ POST /api/booking/create                                       │
│   { showId, selectedSeats: [                                  │
│     { seatNumber: "A1", tierName: "Standard" }               │
│   ]}                                                           │
│   ↓                                                            │
│ bookingController.createBooking()                             │
│   - Validates seats available                                 │
│   - Looks up prices from show.screen.seatTiers                │
│   - Locks seats (LOCKED:bookingId)                           │
│   - Creates Stripe session                                    │
│   ↓                                                            │
│ Redirects to Stripe payment                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### Test 1: Screen Creation with Pricing
1. Login as manager
2. Go to Screens → Add New Screen
3. Select a layout (e.g., "Standard 12x10" with S, D, P tiers)
4. Set tier-based pricing:
   - Standard: ₹180
   - Deluxe: ₹220
   - Premium: ₹280
5. Save screen
6. **Verify**: Screen saved with correct `seatTiers` in database

### Test 2: Show Creation
1. As manager, create a show for the screen created above
2. **Verify**: Show document has `seatTiers` copied from screen

### Test 3: User Booking Flow
1. Logout from manager, login as regular user
2. Navigate to movie → Select show → Opens seat layout
3. **Verify**:
   - ✅ Correct layout displayed (matches the screen's layout)
   - ✅ Seat legend shows: Standard ₹180, Deluxe ₹220, Premium ₹280
   - ✅ Click on seats - they get selected with correct colors
   - ✅ Click again - they get deselected
   - ✅ Price breakdown shows correct prices per tier
   - ✅ Total shows sum of selected seat prices
4. Select seats and proceed to payment
5. **Verify**: Stripe payment amount matches the total

### Test 4: Different Screens Show Different Layouts
1. Create 3 different screens with different layouts
2. Create shows for each screen
3. Book tickets for each show
4. **Verify**: Each show displays its own unique seat layout and pricing

### Test 5: Occupied Seats
1. Complete a booking for seats A1, A2
2. Open the same show again
3. **Verify**: A1 and A2 show as occupied (gray, disabled)
4. Try to select A1
5. **Verify**: Toast error "This seat is already booked"

### Test 6: Concurrent Booking (Locked Seats)
1. Open same show in two browser tabs
2. Tab 1: Start selecting seats but don't complete booking
3. Tab 2: Try to select same seats
4. **Verify**: Should see locked indicator or auto-refresh removes them

---

## 🔧 Migration & Data Fixes

### Migration Script: `fix-empty-screen-layouts.js`

**Purpose**: Fixes ScreenTbl documents with empty `seatLayout.layout` arrays

**What it does:**
1. Finds all ScreenTbl documents with empty layouts
2. Matches them to embedded `theatre.screens` entries
3. Copies layout and pricing from embedded screen to ScreenTbl
4. Converts pricing to seatTiers format
5. Saves updated ScreenTbl document

**Usage:**
```bash
cd server
node scripts/fix-empty-screen-layouts.js
```

### Manual Database Fix (if needed)

If you need to manually fix a screen:

```javascript
// MongoDB shell
db.screen_tbl.updateOne(
  { _id: ObjectId("SCREEN_ID") },
  {
    $set: {
      "seatLayout.layout": [
        ["S","S","S","S"],
        ["P","P","P","P"]
      ],
      "seatTiers": [
        { tierName: "Standard", price: 150, rows: ["A"] },
        { tierName: "Premium", price: 250, rows: ["B"] }
      ]
    }
  }
)
```

---

## ⚠️ Known Issues & Workarounds

### Issue 1: Old Shows Reference Non-Existent ScreenTbl Documents

**Symptom**: Some shows reference `screen._id` that doesn't exist in `screen_tbl` collection

**Workaround**: Frontend now has fallback to read from `show.theatre.screens` embedded array

**Permanent Fix**: Run migration to create ScreenTbl documents for all embedded screens

### Issue 2: Mixed Data Sources

**Symptom**: Some screens have data in ScreenTbl, others only in embedded format

**Status**: Handled by fallback logic in `SeatLayout_New.jsx`

**Recommendation**: Gradually migrate all embedded screens to ScreenTbl collection

---

## 🚀 Deployment Notes

### Required Environment Variables
```env
MONGODB_URI=mongodb://...
STRIPE_SECRET_KEY=sk_...
TMDB_API_KEY=...
```

### Deployment Steps
1. Deploy backend code first
2. Run migration script if needed: `node scripts/fix-empty-screen-layouts.js`
3. Deploy frontend code
4. Test on staging environment
5. Deploy to production

### Post-Deployment Verification
1. Check that screens display correct layouts ✅
2. Verify pricing shows manager-configured amounts ✅
3. Test complete booking flow ✅
4. Monitor for errors in logs

---

## 📝 Code Quality Improvements

### Before vs After

#### Before (Issues):
```javascript
// ❌ Using array - O(n) lookups
const [selectedSeats, setSelectedSeats] = useState([]);
const isSelected = selectedSeats.includes(seatId); // Slow!

// ❌ Hardcoded pricing
const price = SEAT_TIERS[code].basePrice; // Always same price

// ❌ No fallback for missing data
const layout = show.screen.seatLayout.layout; // Crashes if null
```

#### After (Fixed):
```javascript
// ✅ Using Set - O(1) lookups
const [selectedSeats, setSelectedSeats] = useState(new Set());
const isSelected = selectedSeats.has(seatId); // Fast!

// ✅ Dynamic pricing from database
const price = tierPricingMap[code].price; // Actual configured price

// ✅ Fallback chain
const layout = useMemo(() => {
  return show?.screen?.seatLayout?.layout 
    || show?.theatre?.screens[matching]?.layout 
    || null;
}, [show]);
```

---

## 🎯 Key Takeaways

1. **Always validate data exists** - Multiple fallbacks prevent crashes
2. **Use Set for lookups** - Performance matters at scale
3. **Separate data concerns** - ScreenTbl vs embedded screens
4. **Manager controls pricing** - Never hardcode prices
5. **Real-time updates** - Auto-refresh prevents stale data
6. **User feedback** - Loading states, error messages, confirmations

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: Seats not showing after selection**
- Check console for errors
- Verify show.screen.seatLayout exists
- Check if fallback to embedded screens is working

**Q: Wrong prices displayed**
- Verify screen has seatTiers in database
- Check show copied seatTiers from screen
- Ensure tierPricingMap is built correctly

**Q: "Seat already booked" but seat appears available**
- Refresh the page
- Check if seat is locked (LOCKED: prefix in occupiedSeats)
- Verify occupied seats are being fetched

**Q: Empty seat layout**
- Run migration script: `fix-empty-screen-layouts.js`
- Or manually add layout to ScreenTbl document

---

## ✨ Future Enhancements

- [ ] WebSocket for real-time seat updates (no need to refresh)
- [ ] Seat selection analytics (which seats are most popular)
- [ ] Dynamic pricing (surge pricing for peak times)
- [ ] Seat recommendations (best available seats)
- [ ] Accessibility features (screen readers, keyboard navigation)
- [ ] Mobile app with same functionality
- [ ] Bulk screen creation tool for managers
- [ ] Visual seat layout designer in UI

---

**Last Updated**: January 2026  
**Version**: 2.0  
**Status**: ✅ Production Ready