/**
 * rescheduleShows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The original 301 shows have showDateTime in the past, so they are filtered
 * out by the UI query (showDateTime >= today).
 *
 * This script reassigns showDateTime values to TODAY and the next few days,
 * cycling through 3 time slots (10:00, 16:30, 19:30) across the shows.
 *
 * ✅ Does NOT delete any shows or bookings.
 * ✅ Does NOT change endDate (already set to April 30).
 *
 * Run:
 *   cd server && node scripts/rescheduleShows.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// Slots to spread shows across today + next few days
const SLOTS = [
  { h: 10, m: 0  },
  { h: 16, m: 30 },
  { h: 19, m: 30 },
];

function buildDateTime(daysFromNow, h, m) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, m, 0, 0);
  return d;
}

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  const shows = await db.collection("shows_new")
    .find({ isActive: true })
    .sort({ _id: 1 })
    .toArray();

  console.log(`\n🎬 Found ${shows.length} active shows to reschedule`);

  // Build a pool of future datetimes: today + 14 days × 3 slots = 45 slots
  // We cycle through them for all 301 shows
  const futureDatetimes = [];
  for (let day = 0; day < 45; day++) {
    for (const slot of SLOTS) {
      const dt = buildDateTime(day, slot.h, slot.m);
      if (dt > new Date()) futureDatetimes.push(dt);
    }
  }

  console.log(`   Available future slots: ${futureDatetimes.length}`);

  let updated = 0;
  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];
    const newDateTime = futureDatetimes[i % futureDatetimes.length];

    await db.collection("shows_new").updateOne(
      { _id: show._id },
      { $set: { showDateTime: newDateTime, updatedAt: new Date() } }
    );
    updated++;

    if (updated % 50 === 0) {
      process.stdout.write(`\r   Updated ${updated}/${shows.length} shows...`);
    }
  }

  console.log(`\n\n✅ Rescheduled ${updated} shows to future dates`);

  // Verify
  const now = new Date();
  const futureCount = await db.collection("shows_new").countDocuments({
    isActive: true,
    showDateTime: { $gte: now },
  });
  console.log(`📊 Shows with future showDateTime: ${futureCount}`);

  await mongoose.disconnect();
  console.log("✅ Done — shows should now appear on the UI!");
}

run().catch(e => { console.error(e); process.exit(1); });
