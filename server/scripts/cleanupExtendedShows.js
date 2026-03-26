/**
 * cleanupExtendedShows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Removes the ~35k extra shows inserted by extendShowsToApril.js
 * (those created after 2026-03-17T17:30:00Z).
 * Leaves the original ~301 shows intact with their endDate = April 30.
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// Timestamp just before the extend script ran
const CUT_OFF = new Date("2026-03-17T17:30:00.000Z");

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  const before = await db.collection("shows_new").countDocuments();
  console.log(`\n📊 Total shows before cleanup: ${before}`);

  // Delete only shows created AFTER the cut-off (the ones we just seeded)
  const result = await db.collection("shows_new").deleteMany({
    createdAt: { $gte: CUT_OFF },
  });

  console.log(`🗑️  Deleted ${result.deletedCount} extra shows`);

  const after = await db.collection("shows_new").countDocuments();
  console.log(`📊 Total shows remaining:      ${after}`);

  // Quick sanity check on endDates
  const sample = await db.collection("shows_new")
    .find({ isActive: true })
    .sort({ endDate: -1 })
    .limit(3)
    .toArray();

  console.log("\n🔎 Sample endDates on remaining shows:");
  sample.forEach(s => console.log(`   ${s._id}  endDate: ${s.endDate}`));

  await mongoose.disconnect();
  console.log("\n✅ Done. Original shows preserved with endDate = April 30.");
}

run().catch(e => { console.error(e); process.exit(1); });
