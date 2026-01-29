import mongoose from "mongoose";
import "dotenv/config";
import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";

// Seat code to name mapping
const SEAT_CODE_TO_NAME = {
  S: "Standard",
  D: "Deluxe",
  P: "Premium",
  R: "Recliner",
  C: "Couple",
};

// Convert pricing object to seatTiers array
const convertPricingToSeatTiers = (pricing, seatLayout) => {
  if (!pricing) return [];

  const seatTiers = [];
  const tiersInLayout = new Set();

  if (seatLayout?.layout && Array.isArray(seatLayout.layout)) {
    seatLayout.layout.flat().forEach((seat) => {
      if (seat && seat !== "") tiersInLayout.add(seat);
    });
  }

  // If unified pricing, apply same price to all tiers
  if (pricing.unified !== undefined) {
    const price = parseFloat(pricing.unified) || 150;

    tiersInLayout.forEach((code) => {
      const tierName = SEAT_CODE_TO_NAME[code] || "Standard";
      const rows = [];

      if (seatLayout?.layout) {
        seatLayout.layout.forEach((row, idx) => {
          if (row.some((seat) => seat === code)) {
            rows.push(String.fromCharCode(65 + idx));
          }
        });
      }

      seatTiers.push({
        tierName,
        price,
        rows,
        seatsPerRow: seatLayout?.seatsPerRow || 10,
      });
    });
  } else {
    // Tier-based pricing
    Object.entries(pricing).forEach(([code, config]) => {
      if (code === "unified") return;

      const tierName = SEAT_CODE_TO_NAME[code] || code;
      const price = parseFloat(config?.price || config) || 150;
      const rows = [];

      if (seatLayout?.layout) {
        seatLayout.layout.forEach((row, idx) => {
          if (row.some((seat) => seat === code)) {
            rows.push(String.fromCharCode(65 + idx));
          }
        });
      }

      seatTiers.push({
        tierName,
        price,
        rows,
        seatsPerRow: seatLayout?.seatsPerRow || 10,
      });
    });
  }

  return seatTiers;
};

async function fixEmptyScreenLayouts() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all screens with empty layouts
    const screensWithEmptyLayout = await ScreenTbl.find({
      $or: [
        { "seatLayout.layout": { $exists: false } },
        { "seatLayout.layout": { $size: 0 } },
        { "seatLayout.layout": [] },
      ],
    });

    console.log(`📊 Found ${screensWithEmptyLayout.length} screens with empty layouts\n`);

    if (screensWithEmptyLayout.length === 0) {
      console.log("✨ All screens have proper layouts!");
      return;
    }

    let fixed = 0;
    let failed = 0;

    for (const screen of screensWithEmptyLayout) {
      try {
        console.log(`\n🔍 Processing: ${screen.name} (${screen._id})`);
        console.log(`   Theatre: ${screen.theatre}`);
        console.log(`   Current layout: ${JSON.stringify(screen.seatLayout?.layout || [])}`);

        // Find the theatre
        const theatre = await Theatre.findById(screen.theatre);

        if (!theatre) {
          console.log(`   ❌ Theatre not found`);
          failed++;
          continue;
        }

        if (!theatre.screens || !Array.isArray(theatre.screens)) {
          console.log(`   ❌ Theatre has no embedded screens`);
          failed++;
          continue;
        }

        // Find matching embedded screen by ID, screenNumber, or name
        const embeddedScreen = theatre.screens.find((s) => {
          return (
            s._id?.toString() === screen._id.toString() ||
            s.screenNumber === screen.screenNumber ||
            s.name === screen.name
          );
        });

        if (!embeddedScreen) {
          console.log(`   ❌ No matching embedded screen found`);
          console.log(`   Available screens: ${theatre.screens.map(s => s.name).join(", ")}`);
          failed++;
          continue;
        }

        console.log(`   ✓ Found matching embedded screen: ${embeddedScreen.name}`);

        // Check if embedded screen has layout
        if (!embeddedScreen.layout || !embeddedScreen.layout.layout) {
          console.log(`   ❌ Embedded screen has no layout`);
          failed++;
          continue;
        }

        console.log(`   ✓ Embedded screen has layout with ${embeddedScreen.layout.rows} rows`);

        // Copy layout from embedded screen
        screen.seatLayout = {
          layout: embeddedScreen.layout.layout,
          rows: embeddedScreen.layout.rows,
          seatsPerRow: embeddedScreen.layout.seatsPerRow,
          totalSeats: embeddedScreen.layout.totalSeats,
        };

        // Convert pricing to seatTiers if needed
        if (embeddedScreen.pricing) {
          console.log(`   ✓ Converting pricing to seatTiers`);
          const newSeatTiers = convertPricingToSeatTiers(
            embeddedScreen.pricing,
            screen.seatLayout
          );

          if (newSeatTiers.length > 0) {
            screen.seatTiers = newSeatTiers;
            console.log(`   ✓ Added ${newSeatTiers.length} seat tiers`);
          }
        }

        // Save the updated screen
        await screen.save();
        console.log(`   ✅ Screen fixed successfully!`);
        fixed++;
      } catch (error) {
        console.error(`   ❌ Error fixing screen ${screen.name}:`, error.message);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Summary:");
    console.log(`   Total screens: ${screensWithEmptyLayout.length}`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log("=".repeat(50) + "\n");

    if (fixed > 0) {
      console.log("✨ Migration completed successfully!");
    } else {
      console.log("⚠️  No screens were fixed");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the migration
console.log("🚀 Starting screen layout migration...\n");
fixEmptyScreenLayouts();
