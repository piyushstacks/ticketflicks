# Database Migration & Stabilization Guide

## Overview

This guide provides step-by-step instructions for completing the database migration from the old (unstable) schema to the new unified schema. The migration consolidates duplicate models, standardizes field naming, and ensures data consistency across the application.

## Current Status

### Completed
- ✅ Model consolidation (User, Booking, Theatre, Movie, Show, Screen)
- ✅ Field name standardization (user_id, show_id, theater_id, etc.)
- ✅ Controller updates (bookingController unified)
- ✅ Route consolidation (newSchemaRoutes as primary)
- ✅ Verification scripts created

### Remaining
- [ ] Run verification scripts
- [ ] Execute data migration
- [ ] Clean up old duplicate files
- [ ] Deploy to production
- [ ] Monitor for issues

## Schema Changes Summary

### Key Field Renamings

| Entity | Old Fields | New Fields |
|--------|-----------|-----------|
| **Booking** | `user`, `show`, `amount`, `bookedSeats` | `user_id`, `show_id`, `total_amount`, `seats_booked` |
| **Show** | `movie`, `theatre`, `screen`, `showDateTime` | `movie_id`, `theater_id`, `screen_id`, `show_date` |
| **Theatre** | Uses "Theatre" | Standardized as "Theatre" |
| **Movie** | `genres`, `casts` | `genre_ids`, `cast` |

### New Field Additions

- **Booking**: `status` field (pending/confirmed/cancelled)
- **User**: `isDeleted` boolean flag
- **Theatre**: `isDeleted` boolean flag, `approval_date`, `disabled_date`
- **Movie**: `isDeleted` boolean flag
- **Screen**: `isDeleted` boolean flag

## Step-by-Step Migration Instructions

### Step 1: Backup Your Database

**CRITICAL: Always backup before migration**

```bash
# For MongoDB Atlas (cloud)
# Use the Atlas backup feature or mongodump
mongodump --uri="mongodb+srv://..." --out=./backup

# For local MongoDB
mongodump --out=./backup

# Store backup securely
zip -r backup-$(date +%Y%m%d_%H%M%S).zip ./backup
```

### Step 2: Verify Schema Consolidation

Run the consolidation verification script to ensure all models are properly consolidated:

```bash
cd /vercel/share/v0-project
node server/scripts/verifyConsolidation.js
```

**Expected Output:**
```
[VERIFY-CONSOLIDATION] Models Verified: 6
[VERIFY-CONSOLIDATION] ✅ All consolidations verified successfully!
```

If errors appear, stop and review the issues before proceeding.

### Step 3: Run Data Migration

Execute the migration script to transform data from old to new schema:

```bash
node server/scripts/migrateToNewSchema.js
```

**What it does:**
- Creates unified User records with proper field names
- Migrates Theatre data with manager references
- Consolidates Movie data with genre/language/cast references
- Creates Screen entries with proper theatre references
- Migrates Show data with movie/theater/screen references
- Transforms Booking records with seat references
- Creates Payment records for paid bookings

**Expected Output:**
```
[MIGRATE] 🚀 Starting database migration...
[MIGRATE] ✅ Connected to MongoDB
[MIGRATE] ✅ Found 50 users in unified schema
[MIGRATE] ✅ Found 20 theatres
...
[MIGRATE] 🎉 Migration completed successfully!
```

### Step 4: Verify Migration Results

Run comprehensive verification to ensure data integrity:

```bash
node server/scripts/verifyMigration.js
```

**Checks performed:**
- Database connectivity
- Schema validations
- Data consistency
- Referential integrity (foreign keys)
- Field naming conventions
- Model exports

**Expected Output:**
```
[VERIFY] VERIFICATION SUMMARY
[VERIFY] Passed: 8
[VERIFY] Failed: 0
[VERIFY] ✅ All verifications passed! Migration is stable.
```

### Step 5: Clean Up Old Files

Remove duplicate old model files (create archive backup first):

```bash
# First, this will show what will be removed
node server/scripts/cleanupOldFiles.js

# Confirm and execute removal (creates archive)
node server/scripts/cleanupOldFiles.js --force
```

**Files removed:**
- `server/models/User_new.js`
- `server/models/Booking_new.js`
- `server/models/Movie_new.js`
- `server/models/Screen_new.js`
- `server/models/Show_new.js`
- `server/models/Theater_new.js`
- Duplicate controllers (`*_new.js`)
- Archived to: `server/archive/`

### Step 6: Update Environment Variables

Ensure your `.env` file has the correct MongoDB URI:

```env
# MongoDB connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ticketflicks?retryWrites=true&w=majority

# For local development
# MONGODB_URI=mongodb://localhost:27017/ticketflicks

# Stripe settings (if using Stripe integration)
STRIPE_SECRET_KEY=sk_live_...
INR_TO_USD_RATE=0.011
```

### Step 7: Test Application

1. **Start the server:**
   ```bash
   npm run dev
   # or
   node server/server.js
   ```

2. **Test key features:**
   - User registration/login
   - Theatre registration
   - Movie/Show creation
   - Booking creation
   - Payment processing (Stripe)
   - User bookings retrieval

3. **Check API endpoints:**
   ```bash
   curl http://localhost:3000/api/show/shows
   curl http://localhost:3000/api/user/users
   curl http://localhost:3000/api/booking/bookings
   ```

### Step 8: Monitor and Validate

1. **Check application logs** for any errors
2. **Verify booking creation** with real data
3. **Test payment flow** in sandbox/test mode
4. **Monitor database performance** for slow queries
5. **Check user-facing features** for functionality

## Rollback Procedure

If critical issues occur during migration:

### Quick Rollback (First 24 hours)

1. **Restore from backup:**
   ```bash
   mongorestore --uri="mongodb+srv://..." ./backup
   ```

2. **Revert code changes:**
   ```bash
   git revert HEAD~N  # Revert last N commits
   ```

3. **Restart server** with previous version

### Extended Rollback (After 24 hours)

1. **Contact support** if data consistency issues found
2. **Perform full database restore** from encrypted backup
3. **Re-run migration** after fixes are applied
4. **Validate all data** before marking complete

## Troubleshooting

### Issue: "Collection not found" errors

**Solution:**
- Run `verifyConsolidation.js` to check collection names
- Ensure `MONGODB_URI` is correct and database is accessible
- Check MongoDB Atlas cluster whitelist (IP addresses)

### Issue: "Invalid user_id reference" warnings

**Solution:**
- Run verification script to identify problematic bookings
- Manually fix orphaned records:
  ```javascript
  // MongoDB shell
  db.bookings_new.deleteMany({ user_id: null })
  ```

### Issue: Booking creation fails with schema validation

**Solution:**
- Check that booking payload includes all required fields:
  - `user_id`, `show_id`, `seats_booked`, `total_amount`, `status`
- Run `verifyMigration.js` to identify schema issues
- Manually validate booking in MongoDB:
  ```javascript
  db.bookings_new.findOne().toJSON()
  ```

### Issue: "Cannot read property 'user_id' of undefined"

**Solution:**
- Ensure all references use new field names in code
- Search codebase for old field names:
  ```bash
  grep -r "\.user\b" server/ --include="*.js"
  grep -r "\.show\b" server/ --include="*.js"
  grep -r "\.amount\b" server/ --include="*.js"
  ```
- Replace with new names (user_id, show_id, total_amount)

### Issue: Payment webhook failures

**Solution:**
- Check Stripe webhook endpoint configuration
- Ensure `STRIPE_SECRET_KEY` is correctly set
- Verify webhook secret matches in Stripe dashboard
- Check payment record creation in database

## Performance Optimization After Migration

### Create Database Indexes

```javascript
// Run in MongoDB shell or create migration script
db.users_new.createIndex({ "email": 1 })
db.bookings_new.createIndex({ "user_id": 1, "createdAt": -1 })
db.bookings_new.createIndex({ "show_id": 1 })
db.shows_new.createIndex({ "theater_id": 1, "show_date": 1 })
db.shows_new.createIndex({ "movie_id": 1 })
db.theatres.createIndex({ "manager_id": 1 })
db.theatres.createIndex({ "approval_status": 1 })
```

### Analyze Query Performance

```bash
# Enable profiling
node server/scripts/profileQueries.js

# Or use MongoDB Atlas Performance Advisor
# Log into MongoDB Atlas → Performance Advisor
```

## Post-Migration Checklist

- [ ] Database backed up and secured
- [ ] All verification scripts pass
- [ ] Old duplicate files archived/removed
- [ ] Application starts without errors
- [ ] API endpoints respond correctly
- [ ] User registration works
- [ ] Booking creation works
- [ ] Payment processing works
- [ ] All tests pass (`npm test`)
- [ ] No console errors in browser
- [ ] Database indexes created
- [ ] Monitoring/alerts configured
- [ ] Team notified of changes
- [ ] Documentation updated

## Related Files

- **Plan Document**: `/v0_plans/visionary-path.md`
- **Unified Models**: `server/models/{User,Booking,Theatre,Movie,Show,Screen}.js`
- **Updated Controller**: `server/controllers/bookingController.js`
- **Routes**: `server/routes/newSchemaRoutes.js`
- **Scripts**:
  - `server/scripts/verifyConsolidation.js`
  - `server/scripts/migrateToNewSchema.js`
  - `server/scripts/verifyMigration.js`
  - `server/scripts/cleanupOldFiles.js`

## Support

If you encounter issues not covered in this guide:

1. **Check the plan document**: `/v0_plans/visionary-path.md`
2. **Review error logs**: Check application and MongoDB logs
3. **Run diagnostics**: 
   ```bash
   node server/scripts/check-db.js
   node server/scripts/check-migration-db.js
   ```
4. **Create issue**: Document the specific error and steps to reproduce

---

**Last Updated**: 2026-02-28
**Status**: Migration Ready
**Next Action**: Execute Step 1 (Backup) when ready to proceed
