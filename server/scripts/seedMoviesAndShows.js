/**
 * seedMoviesAndShows.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Keeps only 8 movies from the database
 * 2. Removes all other movies and their associated shows
 * 3. Creates 1 show per movie per theatre for 1 week (7 days)
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── 8 Movies to Keep (popular/current releases) ───────────────────────────────
const MOVIES_TO_KEEP = [
  "Chhaava",
  "Sky Force", 
  "Deva",
  "Game Changer",
  "Fateh",
  "Baby John",
  "Azaad",
  "Vanvaas"
];

// ── Show times ────────────────────────────────────────────────────────────────
const SHOW_SLOTS = [
  { h: 10, m: 0, label: "Morning" },
  { h: 13, m: 30, label: "Afternoon" },
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

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  // ── 1. Get all movies ──────────────────────────────────────────────────────
  const allMovies = await db.collection("movies_new").find({}).toArray();
  console.log(`\n🎬 Found ${allMovies.length} movies in database`);

  // ── 2. Identify movies to keep and remove ──────────────────────────────────
  const moviesToKeep = [];
  const moviesToRemove = [];

  for (const movie of allMovies) {
    if (MOVIES_TO_KEEP.some(title => 
      movie.title?.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(movie.title?.toLowerCase())
    )) {
      moviesToKeep.push(movie);
    } else {
      moviesToRemove.push(movie);
    }
  }

  // If we don't have 8 movies, keep some additional ones
  if (moviesToKeep.length < 8) {
    const needed = 8 - moviesToKeep.length;
    const additional = moviesToRemove.splice(0, needed);
    moviesToKeep.push(...additional);
    console.log(`   Added ${additional.length} additional movies to reach 8`);
  }

  // If we have more than 8, trim the list
  while (moviesToKeep.length > 8) {
    moviesToRemove.push(moviesToKeep.pop());
  }

  console.log(`\n✅ Keeping ${moviesToKeep.length} movies:`);
  moviesToKeep.forEach((m, i) => console.log(`   ${i + 1}. ${m.title}`));

  // ── 3. Remove unwanted movies ──────────────────────────────────────────────
  if (moviesToRemove.length > 0) {
    const removeIds = moviesToRemove.map(m => m._id);
    
    // Delete shows for removed movies
    const deletedShows = await db.collection("shows_new").deleteMany({ 
      movie: { $in: removeIds } 
    });
    console.log(`\n🗑️  Removed ${deletedShows.deletedCount} shows for deleted movies`);
    
    // Delete the movies
    const deletedMovies = await db.collection("movies_new").deleteMany({ 
      _id: { $in: removeIds } 
    });
    console.log(`   Removed ${deletedMovies.deletedCount} movies`);
  }

  // ── 4. Get all theatres and screens ────────────────────────────────────────
  const theatres = await db.collection("theatres").find({}).toArray();
  console.log(`\n🏢 Found ${theatres.length} theatres`);

  // Get screens for each theatre
  const screensByTheatre = {};
  for (const theatre of theatres) {
    const screens = await db.collection("screens_new").find({ 
      theatre: theatre._id 
    }).toArray();
    screensByTheatre[theatre._id.toString()] = screens;
  }

  // ── 5. Clear existing shows and create new ones ─────────────────────────────
  await db.collection("shows_new").deleteMany({});
  console.log(`\n🗑️  Cleared all existing shows`);

  console.log(`\n📅 Creating shows: 5 shows per theatre per day for 7 days (releases this week)...`);
  
  let totalShows = 0;
  const keptMovieIds = moviesToKeep.map(m => m._id);

  for (const theatre of theatres) {
    const tId = theatre._id.toString();
    const screens = screensByTheatre[tId] || [];
    
    if (screens.length === 0) {
      console.log(`   ⚠️  ${theatre.name} has no screens, skipping`);
      continue;
    }

    // Create 5 shows per day for 7 days (current week + next few days)
    for (let day = 0; day < 7; day++) {
      for (let slotIdx = 0; slotIdx < SHOW_SLOTS.length; slotIdx++) {
        const slot = SHOW_SLOTS[slotIdx];
        const showDateTime = buildShowDateTime(day, slot.h, slot.m);
        
        // Skip if show time is in the past
        if (showDateTime < new Date()) continue;

        // Rotate movies across shows
        const movieIdx = (day * SHOW_SLOTS.length + slotIdx) % moviesToKeep.length;
        const movie = moviesToKeep[movieIdx];
        const screen = screens[slotIdx % screens.length];

        // Generate random release date within last 30 days for re-release feel
        const daysAgo = Math.floor(Math.random() * 30);
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() - daysAgo);

        // End date should be at least 7 days from now to ensure shows are visible
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14);

        const showDoc = {
          _id: new mongoose.Types.ObjectId(),
          movie: movie._id,
          theatre: theatre._id,
          screen: screen._id,
          showDateTime,
          basePrice: screen.seatTiers?.[0]?.price || 150,
          seatTiers: screen.seatTiers?.map(t => ({ ...t })) || [
            { name: "Silver", price: 150, color: "#6B7280" }
          ],
          totalCapacity: screen.totalSeats || 100,
          status: "available",
          isActive: true,
          startDate: releaseDate,
          endDate: endDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.collection("shows_new").insertOne(showDoc);
        totalShows++;
      }
    }
    
    console.log(`   ✅ ${theatre.name} - 5 shows/day for 7 days`);
  }

  // ── 6. Summary ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding Complete!");
  console.log("────────────────────────────────────────");
  
  const finalMovies = await db.collection("movies_new").countDocuments();
  const finalTheatres = await db.collection("theatres").countDocuments();
  const finalScreens = await db.collection("screens_new").countDocuments();
  const finalShows = await db.collection("shows_new").countDocuments();
  
  console.log(`📊 Final Counts:`);
  console.log(`   Movies:   ${finalMovies}`);
  console.log(`   Theatres: ${finalTheatres}`);
  console.log(`   Screens:  ${finalScreens}`);
  console.log(`   Shows:    ${finalShows}`);
  
  console.log(`\n🎬 Movies Showing:`);
  const finalMovieList = await db.collection("movies_new").find({}).toArray();
  finalMovieList.forEach((m, i) => console.log(`   ${i + 1}. ${m.title}`));

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch(e => { console.error(e); process.exit(1); });
