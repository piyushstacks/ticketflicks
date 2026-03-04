/**
 * seedShows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Approves all theatres
 * 2. Creates 2-3 screens per theatre in screens_new (if not already present)
 * 3. Clears all existing shows in shows_new
 * 4. Seeds realistic shows for multiple movies across all theatres
 *    - Each theatre gets 3-4 movies
 *    - Each movie-theatre combo gets 4-6 showtimes spread over next 14 days
 *    - Showtimes: Morning (10AM), Afternoon (1PM), Evening (4:30PM), Night (7:30PM), Late (10PM)
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── Seat tier config ──────────────────────────────────────────────────────────
const TIERS = {
    SILVER: { name: "Silver", price: 150, color: "#6B7280" },
    GOLD: { name: "Gold", price: 220, color: "#F59E0B" },
    PLATINUM: { name: "Platinum", price: 320, color: "#8B5CF6" },
};

// ── Show times (hours, minutes) ───────────────────────────────────────────────
const SHOW_SLOTS = [
    { h: 10, m: 0, label: "Morning" },
    { h: 13, m: 0, label: "Afternoon" },
    { h: 16, m: 30, label: "Evening" },
    { h: 19, m: 30, label: "Night" },
    { h: 22, m: 30, label: "Late Night" },
];

function buildShowDateTime(daysFromNow, slotH, slotM) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(slotH, slotM, 0, 0);
    return d;
}

function makeScreenLayout(rows, seatsPerRow) {
    const layout = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let s = 1; s <= seatsPerRow; s++) {
            // First 4 rows → Silver, next 4 → Gold, rest → Platinum
            let tier = "Silver";
            if (r >= 4 && r < 8) tier = "Gold";
            if (r >= 8) tier = "Platinum";
            row.push({ seatNumber: `${String.fromCharCode(65 + r)}${s}`, tier, isBooked: false });
        }
        layout.push(row);
    }
    return layout;
}

async function run() {
    await mongoose.connect(uri);
    console.log("✅ Connected to:", mongoose.connection.db.databaseName);
    const db = mongoose.connection.db;

    // ── 1. Approve all theatres ────────────────────────────────────────────────
    const approveResult = await db.collection("theatres").updateMany(
        {},
        { $set: { isApproved: true, status: "approved" } }
    );
    console.log(`\n✅ Approved ${approveResult.modifiedCount} theatres`);

    // Filter out demo/test theatres, keep real ones
    const theatres = await db.collection("theatres").find({
        name: { $not: /demo|test/i },
    }).toArray();
    console.log(`Using ${theatres.length} real theatres`);

    // ── 2. Create screens in screens_new ──────────────────────────────────────
    const SCREEN_CONFIGS = [
        {
            name: "Screen 1 - Platinum", rows: 12, seatsPerRow: 14, totalSeats: 168,
            seatTiers: [TIERS.SILVER, TIERS.GOLD, TIERS.PLATINUM]
        },
        {
            name: "Screen 2 - Gold", rows: 10, seatsPerRow: 12, totalSeats: 120,
            seatTiers: [TIERS.SILVER, TIERS.GOLD]
        },
        {
            name: "Screen 3 - Classic", rows: 8, seatsPerRow: 10, totalSeats: 80,
            seatTiers: [TIERS.SILVER]
        },
    ];

    const screensByTheatre = {};
    for (const theatre of theatres) {
        const existing = await db.collection("screens_new").find({ theatre: theatre._id }).toArray();
        if (existing.length > 0) {
            console.log(`  Skipped screens for "${theatre.name}" (already has ${existing.length})`);
            screensByTheatre[theatre._id.toString()] = existing;
            continue;
        }

        const created = [];
        for (const cfg of SCREEN_CONFIGS) {
            const layout = makeScreenLayout(cfg.rows, cfg.seatsPerRow);
            const doc = {
                _id: new mongoose.Types.ObjectId(),
                name: cfg.name,
                theatre: theatre._id,
                totalSeats: cfg.totalSeats,
                rows: cfg.rows,
                seatsPerRow: cfg.seatsPerRow,
                seatTiers: cfg.seatTiers,
                seatLayout: layout,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await db.collection("screens_new").insertOne(doc);
            created.push(doc);
        }
        screensByTheatre[theatre._id.toString()] = created;
        console.log(`  ✅ Created ${created.length} screens for "${theatre.name}"`);
    }

    // ── 3. Clear old shows ────────────────────────────────────────────────────
    const deleted = await db.collection("shows_new").deleteMany({});
    console.log(`\n🗑️  Removed ${deleted.deletedCount} existing shows`);

    // ── 4. Fetch active movies ────────────────────────────────────────────────
    const movies = await db.collection("movies_new").find({ isActive: true }).toArray();
    console.log(`\n🎬 Seeding shows for ${movies.length} movies across ${theatres.length} theatres...`);

    // Assign movies to theatres — each theatre shows 4-5 different movies
    // Spread systematically so all movies appear at least once
    let totalShows = 0;

    for (const theatre of theatres) {
        const tId = theatre._id.toString();
        const screens = screensByTheatre[tId] || [];
        if (screens.length === 0) continue;

        // Pick 4 movies for this theatre (cycling through all movies)
        const theatreIdx = theatres.indexOf(theatre);
        const selectedMovies = [];
        for (let i = 0; i < 4; i++) {
            selectedMovies.push(movies[(theatreIdx * 4 + i) % movies.length]);
        }

        for (let mi = 0; mi < selectedMovies.length; mi++) {
            const movie = selectedMovies[mi];
            const screen = screens[mi % screens.length];

            // Create shows over next 14 days using 3 different time slots per day
            const daysToSchedule = [0, 1, 2, 3, 5, 7, 10, 14]; // specific days
            const slots = [SHOW_SLOTS[0], SHOW_SLOTS[2], SHOW_SLOTS[3]]; // Morning, Evening, Night

            for (const day of daysToSchedule) {
                for (const slot of slots) {
                    const showDateTime = buildShowDateTime(day, slot.h, slot.m);
                    // Skip past times for today
                    if (showDateTime < new Date()) continue;

                    const showDoc = {
                        _id: new mongoose.Types.ObjectId(),
                        movie: movie._id,
                        theatre: theatre._id,
                        screen: screen._id,
                        showDateTime,
                        seatTiers: screen.seatTiers.map(t => ({ ...t })),
                        totalSeats: screen.totalSeats,
                        bookedSeats: [],
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    await db.collection("shows_new").insertOne(showDoc);
                    totalShows++;
                }
            }
        }

        console.log(`  ✅ "${theatre.name}" — ${selectedMovies.map(m => m.title).join(", ")}`);
    }

    console.log(`\n🎉 Done! Created ${totalShows} shows across ${theatres.length} theatres`);

    // ── Verify ────────────────────────────────────────────────────────────────
    const showCount = await db.collection("shows_new").countDocuments();
    const screenCount = await db.collection("screens_new").countDocuments();
    console.log(`\n📊 Final counts:`);
    console.log(`   screens_new: ${screenCount}`);
    console.log(`   shows_new:   ${showCount}`);

    await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
