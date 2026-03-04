/**
 * updateMovieReleaseDates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Updates all movie release dates to be within the current month
 * Simulates re-releases or current releases
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  // Get current date info
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  console.log(`\n📅 Setting release dates to ${now.toLocaleString('default', { month: 'long' })} ${currentYear}`);

  // Get all movies
  const movies = await db.collection("movies_new").find({}).toArray();
  console.log(`🎬 Found ${movies.length} movies`);

  // Distribute release dates across the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    
    // Spread movies across the month (one movie every few days)
    const dayOfMonth = Math.min(1 + (i * 3), daysInMonth - 1); // Stagger releases
    
    const releaseDate = new Date(currentYear, currentMonth, dayOfMonth);
    
    await db.collection("movies_new").updateOne(
      { _id: movie._id },
      { 
        $set: { 
          release_date: releaseDate,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`   ✅ ${movie.title} → ${releaseDate.toDateString()}`);
  }

  // Summary
  console.log("\n🎉 Release dates updated!");
  console.log("────────────────────────────────────────");
  
  const updatedMovies = await db.collection("movies_new").find({}).toArray();
  console.log(`\n📊 Movie Release Schedule:`);
  updatedMovies.forEach((m, i) => {
    const date = m.release_date ? new Date(m.release_date).toDateString() : 'N/A';
    console.log(`   ${i + 1}. ${m.title} - ${date}`);
  });

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch(e => { console.error(e); process.exit(1); });
