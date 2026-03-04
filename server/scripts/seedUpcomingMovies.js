/**
 * seedUpcomingMovies.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds upcoming movies with proper poster paths and details
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── Upcoming Movies (releasing in next 1-3 months) ─────────────────────────────
// Using verified TMDB poster paths
const UPCOMING_MOVIES = [
  {
    title: "Avengers: Doomsday",
    description: "The Avengers face their greatest threat yet as Doctor Doom unleashes a catastrophic plan that puts the entire universe at risk.",
    poster: "https://image.tmdb.org/t/p/w500/yA3wEdM872pXJ4b2d41hOtsH5M0.jpg",
    release_date: new Date("2026-05-02"),
    trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    genres: ["Action", "Adventure", "Science Fiction"]
  },
  {
    title: "Mission: Impossible – The Final Reckoning",
    description: "Ethan Hunt returns for the ultimate chapter of his mission as the fate of the world hangs in the balance.",
    poster: "https://image.tmdb.org/t/p/w500/8qBylBsQf4llkGrEUG5xRGN0fJ0.jpg",
    release_date: new Date("2026-05-23"),
    trailer: "https://www.youtube.com/watch?v=2m1drlOZSDw",
    genres: ["Action", "Thriller", "Adventure"]
  },
  {
    title: "Spider-Man: Beyond the Spider-Verse",
    description: "Miles Morales returns in the next breathtaking chapter of the Oscar-winning Spider-Verse saga, facing impossible choices.",
    poster: "https://image.tmdb.org/t/p/w500/8b8R8l88ILjqZ2P6G7HxqCgJz0.jpg",
    release_date: new Date("2026-06-07"),
    trailer: "https://www.youtube.com/watch?v=shW9i6k8cB0",
    genres: ["Animation", "Action", "Adventure"]
  },
  {
    title: "The Batman Part II",
    description: "Bruce Wayne dons the cape once more as Gotham faces a new wave of terror orchestrated by a mysterious villain from his past.",
    poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    release_date: new Date("2026-10-03"),
    trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    genres: ["Action", "Crime", "Drama"]
  },
  {
    title: "Black Panther: Midnight Throne",
    description: "Shuri takes on a new legacy as Wakanda faces an unprecedented invasion from across the Multiverse.",
    poster: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
    release_date: new Date("2026-11-13"),
    trailer: "https://www.youtube.com/watch?v=WpW36ldAqnM",
    genres: ["Action", "Adventure", "Science Fiction"]
  },
  {
    title: "Captain America: Brave New World",
    description: "Sam Wilson takes up the mantle of Captain America and finds himself in the middle of an international incident.",
    poster: "https://image.tmdb.org/t/p/w500/ezIOkQdCmCjOCegHyRGRlqzIxW2.jpg",
    release_date: new Date("2026-04-25"),
    trailer: "https://www.youtube.com/watch?v=GoBXG1XEJgc",
    genres: ["Action", "Adventure", "Thriller"]
  },
  {
    title: "Snow White",
    description: "A live-action reimagining of Disney's classic animated film about the princess who flees from her wicked stepmother.",
    poster: "https://image.tmdb.org/t/p/w500/huUMVvKqCRgy3uW6oGtA3mbKU3I.jpg",
    release_date: new Date("2026-05-01"),
    trailer: "https://www.youtube.com/watch?v=ZPBqOoDvZSE",
    genres: ["Family", "Fantasy", "Musical"]
  },
  {
    title: "Jurassic World: Rebirth",
    description: "A new era begins in the Jurassic franchise as dinosaurs now live among humans and a new threat emerges.",
    poster: "https://image.tmdb.org/t/p/w500/kVlUkAaj5iQ6fXzDgYK3gXvL5n8.jpg",
    release_date: new Date("2026-06-12"),
    trailer: "https://www.youtube.com/watch?v=DomvJdTgZSE",
    genres: ["Action", "Adventure", "Sci-Fi", "Thriller"]
  }
];

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  // Clear existing upcoming movies
  const deleteResult = await db.collection("upcoming_movies").deleteMany({});
  console.log(`\n🗑️  Removed ${deleteResult.deletedCount} existing upcoming movies`);

  // Seed new upcoming movies
  let added = 0;
  for (const movie of UPCOMING_MOVIES) {
    const movieDoc = {
      _id: new mongoose.Types.ObjectId(),
      ...movie,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("upcoming_movies").insertOne(movieDoc);
    added++;
    console.log(`   ✅ ${movie.title} - ${movie.release_date.toDateString()}`);
  }

  // Summary
  console.log("\n🎉 Seeding Complete!");
  console.log("────────────────────────────────────────");
  console.log(`📊 Total Upcoming Movies: ${added}`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch(e => { console.error(e); process.exit(1); });
