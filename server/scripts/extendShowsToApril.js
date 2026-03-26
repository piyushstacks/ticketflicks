/**
 * extendShowsToApril.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Extends all existing active shows in shows_new so they run until April 30
 * 2026, and seeds new show-date documents for every (movie, theatre, screen,
 * slot) combination from tomorrow through April 30, 2026.
 *
 * ✅ This script does NOT delete any existing shows or bookings.
 *
 * Run:
 *   cd server && node scripts/extendShowsToApril.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── Target end date ──────────────────────────────────────────────────────────
const APRIL_END = new Date("2026-04-30T23:59:59.000+05:30");

// ── Show time slots ──────────────────────────────────────────────────────────
const SHOW_SLOTS = [
  { h: 10, m: 0,  label: "Morning"    },
  { h: 13, m: 0,  label: "Afternoon"  },
  { h: 16, m: 30, label: "Evening"    },
  { h: 19, m: 30, label: "Night"      },
  { h: 22, m: 30, label: "Late Night" },
];

function buildDateTime(dateObj, slotH, slotM) {
  const d = new Date(dateObj);
  d.setHours(slotH, slotM, 0, 0);
  return d;
}

/** Returns an array of Date objects, one per calendar day from start to end (inclusive) */
function dateRange(start, end) {
  const days = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  const now = new Date();

  // ── Step 1: Extend endDate on all existing shows ───────────────────────────
  const extendResult = await db.collection("shows_new").updateMany(
    { isActive: true },
    { $set: { endDate: APRIL_END, updatedAt: new Date() } }
  );
  console.log(`\n📅 Extended endDate to Apr 30 on ${extendResult.modifiedCount} existing shows`);

  // ── Step 2: Collect unique (movie, theatre, screen, seatTiers, totalSeats) combos ──
  const existingShows = await db.collection("shows_new").find({ isActive: true }).toArray();

  console.log(`\n🔍 Found ${existingShows.length} active shows to build combo map from`);

  // Deduplicate by movie+theatre+screen key — keep one representative doc per combo
  const combos = new Map();
  for (const show of existingShows) {
    const key = `${show.movie}-${show.theatre}-${show.screen}`;
    if (!combos.has(key)) {
      combos.set(key, {
        movie:      show.movie,
        theatre:    show.theatre,
        screen:     show.screen,
        seatTiers:  show.seatTiers,
        totalSeats: show.totalSeats || show.totalCapacity || 100,
      });
    }
  }
  console.log(`   Unique (movie × theatre × screen) combos: ${combos.size}`);

  // ── Step 3: Find the latest existing showDateTime so we don't duplicate ────
  const latestDoc = await db.collection("shows_new")
    .find({ isActive: true })
    .sort({ showDateTime: -1 })
    .limit(1)
    .toArray();

  // Start seeding from the day AFTER the latest existing show (or tomorrow if none)
  let seedFrom = new Date(now);
  seedFrom.setDate(seedFrom.getDate() + 1);
  seedFrom.setHours(0, 0, 0, 0);

  if (latestDoc.length > 0 && latestDoc[0].showDateTime > seedFrom) {
    seedFrom = new Date(latestDoc[0].showDateTime);
    seedFrom.setDate(seedFrom.getDate() + 1);
    seedFrom.setHours(0, 0, 0, 0);
  }

  const seedEnd = new Date("2026-04-30T00:00:00.000+05:30");

  if (seedFrom > seedEnd) {
    console.log(`\n✅ Shows already extend beyond April 30 — no new shows required!`);
    await mongoose.disconnect();
    return;
  }

  console.log(`\n🌱 Seeding new shows from ${seedFrom.toDateString()} → Apr 30 2026`);

  // ── Step 4: Seed new show documents ───────────────────────────────────────
  const days = dateRange(seedFrom, seedEnd);
  console.log(`   Days to fill: ${days.length}`);

  const comboList = [...combos.values()];
  let inserted = 0;
  const BATCH = 500;
  let batch = [];

  // We'll use one slot per combo per day, rotating slots to spread load
  const slotCount = SHOW_SLOTS.length;

  for (const day of days) {
    for (let ci = 0; ci < comboList.length; ci++) {
      const combo = comboList[ci];
      // Rotate which slot(s) are used — use 3 slots per combo/day (Morning, Evening, Night)
      const slotsForDay = [
        SHOW_SLOTS[0], // Morning
        SHOW_SLOTS[2], // Evening
        SHOW_SLOTS[3], // Night
      ];

      for (const slot of slotsForDay) {
        const showDateTime = buildDateTime(day, slot.h, slot.m);
        // Skip if in the past
        if (showDateTime < now) continue;

        batch.push({
          _id:          new mongoose.Types.ObjectId(),
          movie:        combo.movie,
          theatre:      combo.theatre,
          screen:       combo.screen,
          showDateTime,
          seatTiers:    combo.seatTiers,
          totalSeats:   combo.totalSeats,
          bookedSeats:  [],
          isActive:     true,
          startDate:    new Date(day.toDateString()),
          endDate:      APRIL_END,
          createdAt:    new Date(),
          updatedAt:    new Date(),
        });
      }

      if (batch.length >= BATCH) {
        await db.collection("shows_new").insertMany(batch, { ordered: false });
        inserted += batch.length;
        process.stdout.write(`\r   Inserted ${inserted} shows...`);
        batch = [];
      }
    }
  }

  // Final batch
  if (batch.length > 0) {
    await db.collection("shows_new").insertMany(batch, { ordered: false });
    inserted += batch.length;
  }

  console.log(`\n\n🎉 Done! Inserted ${inserted} new shows`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalShows = await db.collection("shows_new").countDocuments();
  const activeShows = await db.collection("shows_new").countDocuments({ isActive: true });
  console.log(`\n📊 shows_new totals:`);
  console.log(`   Total shows:  ${totalShows}`);
  console.log(`   Active shows: ${activeShows}`);

  await mongoose.disconnect();
  console.log("✅ Disconnected");
}

run().catch(e => { console.error(e); process.exit(1); });
