import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Show from "../models/Show.js";

dotenv.config();

const migrateBookingIds = async () => {
  try {
    console.log("🔄 Starting Booking ID Migration...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all bookings using native collection to avoid schema validation
    const bookingsCollection = mongoose.connection.collection("bookings");
    const allBookings = await bookingsCollection.find({}).toArray();

    console.log(`📊 Found ${allBookings.length} bookings to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of allBookings) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Check if user field is a string
        if (typeof booking.user === "string") {
          // Check if it's a valid ObjectId string
          if (mongoose.Types.ObjectId.isValid(booking.user)) {
            // Verify user exists
            const userExists = await User.findById(booking.user);
            if (userExists) {
              updates.user = new mongoose.Types.ObjectId(booking.user);
              needsUpdate = true;
              console.log(`  Converting user ID: ${booking.user} → ObjectId`);
            } else {
              console.log(`  ⚠️  User not found for booking ${booking._id}, keeping as string`);
            }
          } else {
            console.log(`  ⚠️  Invalid ObjectId format for user in booking ${booking._id}: ${booking.user}`);
          }
        }

        // Check if show field is a string
        if (typeof booking.show === "string") {
          // Check if it's a valid ObjectId string
          if (mongoose.Types.ObjectId.isValid(booking.show)) {
            // Verify show exists
            const showExists = await Show.findById(booking.show);
            if (showExists) {
              updates.show = new mongoose.Types.ObjectId(booking.show);
              needsUpdate = true;
              console.log(`  Converting show ID: ${booking.show} → ObjectId`);
            } else {
              console.log(`  ⚠️  Show not found for booking ${booking._id}, keeping as string`);
            }
          } else {
            console.log(`  ⚠️  Invalid ObjectId format for show in booking ${booking._id}: ${booking.show}`);
          }
        }

        // Update if needed
        if (needsUpdate) {
          await bookingsCollection.updateOne(
            { _id: booking._id },
            { $set: updates }
          );
          updated++;
          console.log(`✅ Updated booking ${booking._id}\n`);
        } else {
          skipped++;
          if (skipped <= 5) {
            console.log(`⏭️  Skipped booking ${booking._id} (already correct format)\n`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing booking ${booking._id}:`, error.message, "\n");
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📈 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`✅ Updated: ${updated} bookings`);
    console.log(`⏭️  Skipped: ${skipped} bookings`);
    console.log(`❌ Errors: ${errors} bookings`);
    console.log("=".repeat(50) + "\n");

    if (updated > 0) {
      console.log("🎉 Migration completed successfully!");
    } else {
      console.log("ℹ️  No bookings needed migration.");
    }

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateBookingIds();
