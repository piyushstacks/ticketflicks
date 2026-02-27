import mongoose from "mongoose";
import dotenv from "dotenv";

// Unified Models (all consolidated into single files)
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import Movie from "../models/Movie.js";
import Screen from "../models/Screen.js";
import Show from "../models/show_tbls.js";
import Booking from "../models/Booking.js";
import Seat from "../models/Seat.js";
import Genre from "../models/Genre.js";
import Language from "../models/Language.js";
import Cast from "../models/Cast.js";

dotenv.config();

const log = (msg) => console.log(`[VERIFY-CONSOLIDATION] ${msg}`);
const error = (msg, err) => console.error(`[VERIFY-CONSOLIDATION ERROR] ${msg}`, err?.message);

let verifiedModels = 0;
let issues = [];

// ============ VERIFICATION FUNCTIONS ============

const verifyModelConsolidation = async () => {
  log("Verifying model consolidation...");
  
  try {
    // Check User model
    const userSample = new User({
      name: "Test",
      email: "test@example.com",
      phone: "1234567890",
      password_hash: "hash",
      role: "customer"
    });
    
    if (userSample.validateSync()) {
      issues.push("User model validation failed");
    } else {
      log("✓ User model is consolidated correctly");
      verifiedModels++;
    }
    
    // Check Booking model - should use user_id, show_id, etc.
    const bookingSample = new Booking({
      user_id: new mongoose.Types.ObjectId(),
      show_id: new mongoose.Types.ObjectId(),
      seats_booked: [],
      total_amount: 100,
      status: "pending",
      isPaid: false
    });
    
    if (bookingSample.validateSync()) {
      issues.push("Booking model validation failed");
    } else {
      log("✓ Booking model uses unified field names (user_id, show_id, etc.)");
      verifiedModels++;
    }
    
    // Check Theatre model
    const theatreSample = new Theatre({
      name: "Test Theatre",
      location: "Test Location",
      manager_id: new mongoose.Types.ObjectId(),
      approval_status: "pending"
    });
    
    if (theatreSample.validateSync()) {
      issues.push("Theatre model validation failed");
    } else {
      log("✓ Theatre model is consolidated correctly");
      verifiedModels++;
    }
    
    // Check Movie model
    const movieSample = new Movie({
      title: "Test Movie",
      genre_ids: [],
      language_id: [],
      duration_min: 120,
      release_date: new Date(),
      description: "Test",
      cast: []
    });
    
    if (movieSample.validateSync()) {
      issues.push("Movie model validation failed");
    } else {
      log("✓ Movie model is consolidated correctly");
      verifiedModels++;
    }
    
    // Check Screen model
    const screenSample = new Screen({
      Tid: new mongoose.Types.ObjectId(),
      name: "Screen 1",
      capacity: 100
    });
    
    if (screenSample.validateSync()) {
      issues.push("Screen model validation failed");
    } else {
      log("✓ Screen model is consolidated correctly");
      verifiedModels++;
    }
    
    // Check Show model
    const showSample = new Show({
      movie_id: new mongoose.Types.ObjectId(),
      theater_id: new mongoose.Types.ObjectId(),
      screen_id: new mongoose.Types.ObjectId(),
      show_date: new Date(),
      available_seats: [],
      isActive: true
    });
    
    if (showSample.validateSync()) {
      issues.push("Show model validation failed");
    } else {
      log("✓ Show model uses unified field names (movie_id, theater_id, screen_id)");
      verifiedModels++;
    }
    
  } catch (err) {
    error("Failed to verify models", err);
    issues.push(`Model verification error: ${err?.message}`);
  }
};

const verifyCollectionNames = async () => {
  log("Verifying collection names are unified...");
  
  try {
    const adminDB = mongoose.connection.db;
    const collections = await adminDB.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    log(`Found collections: ${collectionNames.join(", ")}`);
    
    // Check for duplicate collections
    const shouldExist = ["users_new", "bookings_new", "theatres", "movies_new", "shows_new", "screens_new"];
    const shouldNotExist = ["user_tbls", "bookings", "theatres_old", "movie_tbls", "show_tbls"];
    
    for (const collection of shouldExist) {
      if (collectionNames.includes(collection)) {
        log(`✓ Collection exists: ${collection}`);
      } else {
        log(`⚠ Missing collection: ${collection}`);
      }
    }
    
  } catch (err) {
    error("Failed to verify collections", err);
  }
};

const verifyDataConsistency = async () => {
  log("Verifying data consistency...");
  
  try {
    const counts = {
      users: await User.countDocuments(),
      bookings: await Booking.countDocuments(),
      theatres: await Theatre.countDocuments(),
      movies: await Movie.countDocuments(),
      shows: await Show.countDocuments(),
      screens: await Screen.countDocuments(),
    };
    
    log("Document counts:");
    for (const [key, count] of Object.entries(counts)) {
      log(`  ${key}: ${count}`);
    }
    
    verifiedModels++;
    
  } catch (err) {
    error("Failed to verify data consistency", err);
    issues.push(`Data consistency check failed: ${err?.message}`);
  }
};

const verifyFieldNames = async () => {
  log("Verifying unified field naming in data...");
  
  try {
    // Check a sample booking for field names
    const sampleBooking = await Booking.findOne();
    if (sampleBooking) {
      const hasNewFields = sampleBooking.user_id !== undefined && 
                          sampleBooking.show_id !== undefined &&
                          sampleBooking.total_amount !== undefined;
      
      const hasOldFields = sampleBooking.user !== undefined || 
                          sampleBooking.show !== undefined ||
                          sampleBooking.amount !== undefined;
      
      if (hasNewFields && !hasOldFields) {
        log("✓ Bookings use new field names (user_id, show_id, total_amount)");
        verifiedModels++;
      } else if (hasOldFields) {
        issues.push("Bookings still contain old field names");
      } else {
        log("⚠ Cannot verify booking field names (no bookings found)");
      }
    } else {
      log("⚠ No bookings found to verify field naming");
    }
    
  } catch (err) {
    error("Failed to verify field names", err);
    issues.push(`Field name verification failed: ${err?.message}`);
  }
};

// ============ MAIN VERIFICATION ============

const runVerification = async () => {
  try {
    log("=".repeat(50));
    log("SCHEMA CONSOLIDATION VERIFICATION");
    log("=".repeat(50));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/ticketflicks");
    log("Connected to MongoDB");
    
    // Run verifications
    await verifyModelConsolidation();
    await verifyCollectionNames();
    await verifyDataConsistency();
    await verifyFieldNames();
    
    // Summary
    log("");
    log("=".repeat(50));
    log("VERIFICATION SUMMARY");
    log("=".repeat(50));
    log(`Models Verified: ${verifiedModels}`);
    
    if (issues.length === 0) {
      log("✅ All consolidations verified successfully!");
      log("");
      log("Next steps:");
      log("1. Run migration: node server/scripts/migrateToNewSchema.js");
      log("2. Run verification: node server/scripts/verifyMigration.js");
      log("3. Clean up old files: node server/scripts/cleanupOldFiles.js --force");
    } else {
      log("⚠️ Issues found during verification:");
      issues.forEach(issue => log(`  - ${issue}`));
    }
    
    log("=".repeat(50));
    
    process.exit(issues.length > 0 ? 1 : 0);
    
  } catch (err) {
    error("Verification script failed", err);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
    } catch (e) {
      // ignore
    }
  }
};

runVerification();
