import mongoose from "mongoose";
import dotenv from "dotenv";

// Import unified models
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Theatre from "../models/Theatre.js";
import Movie from "../models/Movie.js";
import Show from "../models/show_tbls.js";
import Screen from "../models/Screen.js";
import Seat from "../models/Seat.js";
import Genre from "../models/Genre.js";
import Language from "../models/Language.js";
import Cast from "../models/Cast.js";

dotenv.config();

const log = (msg) => console.log(`[VERIFY] ${msg}`);
const error = (msg, err) => console.error(`[VERIFY ERROR] ${msg}`, err);
const warn = (msg) => console.warn(`[VERIFY WARN] ${msg}`);

let passedChecks = 0;
let failedChecks = 0;

// ============ VERIFICATION FUNCTIONS ============

const verifyDatabaseConnection = async () => {
  try {
    const adminDB = mongoose.connection.db;
    const collections = await adminDB.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    log("Connected to database successfully");
    log(`Found collections: ${collectionNames.join(", ")}`);
    
    return true;
  } catch (err) {
    error("Failed to connect to database", err.message);
    failedChecks++;
    return false;
  }
};

const verifyModelSchemas = async () => {
  log("Verifying model schemas...");
  
  try {
    // Check User schema
    const user = new User({
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      password_hash: "hash",
      role: "customer"
    });
    
    const userValidation = user.validateSync();
    if (userValidation) {
      warn(`User schema validation failed: ${userValidation.message}`);
    } else {
      log("✓ User schema is valid");
      passedChecks++;
    }
    
    // Check Booking schema
    const bookingData = {
      user_id: new mongoose.Types.ObjectId(),
      show_id: new mongoose.Types.ObjectId(),
      seats_booked: [],
      total_amount: 100,
      status: "pending",
      isPaid: false
    };
    
    const booking = new Booking(bookingData);
    const bookingValidation = booking.validateSync();
    if (bookingValidation) {
      warn(`Booking schema validation failed: ${bookingValidation.message}`);
    } else {
      log("✓ Booking schema is valid");
      passedChecks++;
    }
    
    // Check Theatre schema
    const theatre = new Theatre({
      name: "Test Theatre",
      location: "Test Location",
      manager_id: new mongoose.Types.ObjectId(),
      approval_status: "pending"
    });
    
    const theatreValidation = theatre.validateSync();
    if (theatreValidation) {
      warn(`Theatre schema validation failed: ${theatreValidation.message}`);
    } else {
      log("✓ Theatre schema is valid");
      passedChecks++;
    }
    
  } catch (err) {
    error("Schema validation error", err.message);
    failedChecks++;
  }
};

const verifyCollectionData = async () => {
  log("Verifying collection data...");
  
  try {
    const userCount = await User.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const theatreCount = await Theatre.countDocuments();
    const movieCount = await Movie.countDocuments();
    const showCount = await Show.countDocuments();
    const screenCount = await Screen.countDocuments();
    
    log(`Users: ${userCount}`);
    log(`Bookings: ${bookingCount}`);
    log(`Theatres: ${theatreCount}`);
    log(`Movies: ${movieCount}`);
    log(`Shows: ${showCount}`);
    log(`Screens: ${screenCount}`);
    
    passedChecks++;
  } catch (err) {
    error("Failed to count documents", err.message);
    failedChecks++;
  }
};

const verifyIndexes = async () => {
  log("Verifying database indexes...");
  
  try {
    // User indexes
    const userIndexes = await User.collection.getIndexes();
    if (userIndexes.email_1) {
      log("✓ User email index exists");
      passedChecks++;
    } else {
      warn("User email index not found");
    }
    
    // Booking indexes
    const bookingIndexes = await Booking.collection.getIndexes();
    if (bookingIndexes.user_id_1_createdAt_-1) {
      log("✓ Booking user_id_createdAt index exists");
      passedChecks++;
    } else {
      warn("Booking user_id_createdAt index not found");
    }
    
  } catch (err) {
    error("Failed to verify indexes", err.message);
    failedChecks++;
  }
};

const verifyReferentialIntegrity = async () => {
  log("Verifying referential integrity...");
  
  try {
    // Check for bookings with invalid user_id references
    const bookingsWithUsers = await Booking.find().populate("user_id");
    let invalidUsers = 0;
    
    for (const booking of bookingsWithUsers) {
      if (!booking.user_id) {
        invalidUsers++;
        warn(`Booking ${booking._id} has invalid user_id reference`);
      }
    }
    
    if (invalidUsers === 0) {
      log("✓ All bookings have valid user references");
      passedChecks++;
    } else {
      warn(`Found ${invalidUsers} bookings with invalid user references`);
      failedChecks++;
    }
    
    // Check for shows with invalid references
    const showsWithReferences = await Show.find().populate(["movie_id", "theater_id", "screen_id"]);
    let invalidShows = 0;
    
    for (const show of showsWithReferences) {
      if (!show.movie_id || !show.theater_id || !show.screen_id) {
        invalidShows++;
        warn(`Show ${show._id} has missing references`);
      }
    }
    
    if (invalidShows === 0) {
      log("✓ All shows have valid references");
      passedChecks++;
    } else {
      warn(`Found ${invalidShows} shows with invalid references`);
      failedChecks++;
    }
    
  } catch (err) {
    error("Failed to verify referential integrity", err.message);
    failedChecks++;
  }
};

const verifyFieldNaming = async () => {
  log("Verifying unified field naming conventions...");
  
  try {
    // Check booking field names
    const sampleBooking = await Booking.findOne();
    if (sampleBooking) {
      const hasOldFields = sampleBooking.user || sampleBooking.show || sampleBooking.amount;
      const hasNewFields = sampleBooking.user_id && sampleBooking.show_id && sampleBooking.total_amount;
      
      if (hasNewFields && !hasOldFields) {
        log("✓ Booking uses new field naming (user_id, show_id, total_amount)");
        passedChecks++;
      } else if (hasOldFields) {
        warn("Booking contains old field names");
        failedChecks++;
      }
    } else {
      log("⚠ No bookings found to verify field naming");
    }
    
  } catch (err) {
    error("Failed to verify field naming", err.message);
    failedChecks++;
  }
};

const verifyModelExports = async () => {
  log("Verifying model exports...");
  
  try {
    // Check that models are correctly instantiated
    const models = [
      { name: "User", model: User },
      { name: "Booking", model: Booking },
      { name: "Theatre", model: Theatre },
      { name: "Movie", model: Movie },
      { name: "Show", model: Show },
      { name: "Screen", model: Screen }
    ];
    
    for (const { name, model } of models) {
      if (model && model.collection) {
        log(`✓ ${name} model is properly exported`);
        passedChecks++;
      } else {
        warn(`${name} model export issue detected`);
        failedChecks++;
      }
    }
    
  } catch (err) {
    error("Failed to verify model exports", err.message);
    failedChecks++;
  }
};

// ============ MAIN VERIFICATION RUNNER ============

const runVerification = async () => {
  try {
    log("========================================");
    log("DATABASE MIGRATION VERIFICATION");
    log("========================================");
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ticketflicks");
    log("Connected to MongoDB");
    
    // Run all verification checks
    await verifyDatabaseConnection();
    await verifyModelSchemas();
    await verifyCollectionData();
    await verifyIndexes();
    await verifyReferentialIntegrity();
    await verifyFieldNaming();
    await verifyModelExports();
    
    // Summary
    log("========================================");
    log(`VERIFICATION SUMMARY`);
    log(`Passed: ${passedChecks}`);
    log(`Failed: ${failedChecks}`);
    log("========================================");
    
    if (failedChecks === 0) {
      log("✅ All verifications passed! Migration is stable.");
      process.exit(0);
    } else {
      log("⚠️ Some verifications failed. Please review the issues above.");
      process.exit(1);
    }
    
  } catch (err) {
    error("Verification script failed", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

runVerification();
