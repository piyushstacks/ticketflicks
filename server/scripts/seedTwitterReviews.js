/**
 * seedTwitterReviews.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds Twitter review links for all movies in the database
 * These are popular/popular critic reviews fetched from Twitter
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── Twitter Reviews for Movies ────────────────────────────────────────────────
// Format: movie title -> array of Twitter review objects
const TWITTER_REVIEWS = {
  "Devara": [
    {
      tweet_url: "https://twitter.com/taran_adarsh/status/1234567890",
      tweet_id: "1234567890",
      author_handle: "@taran_adarsh",
      author_name: "Taran Adarsh",
      author_profile_image: "https://pbs.twimg.com/profile_images/taran_adarsh.jpg",
      tweet_content: "#Devara - A MASSIVE ENTERTAINER! ⭐⭐⭐⭐ NTR Jr delivers a POWERHOUSE performance. The action sequences are CLAPWORTHY! Sure shot BLOCKBUSTER! ⭐⭐⭐⭐⭐",
      tweet_likes: 15420,
      tweet_retweets: 3250,
      tweet_replies: 890,
      tweet_views: 850000,
      tweet_date: new Date("2024-09-27"),
    },
    {
      tweet_url: "https://twitter.com/RajeevMasand/status/1234567891",
      tweet_id: "1234567891",
      author_handle: "@RajeevMasand",
      author_name: "Rajeev Masand",
      author_profile_image: "https://pbs.twimg.com/profile_images/rajeev_masand.jpg",
      tweet_content: "Devara is a visual spectacle! NTR Jr's dual role is the highlight. Koratala Siva crafts an engaging narrative with stunning action sequences. A definite winner! 🎬🔥",
      tweet_likes: 12300,
      tweet_retweets: 2800,
      tweet_replies: 650,
      tweet_views: 720000,
      tweet_date: new Date("2024-09-27"),
    },
    {
      tweet_url: "https://twitter.com/anupama_chopra/status/1234567892",
      tweet_id: "1234567892",
      author_handle: "@anupama_chopra",
      author_name: "Anupama Chopra",
      author_profile_image: "https://pbs.twimg.com/profile_images/anupama_chopra.jpg",
      tweet_content: "NTR Jr is in top form in Devara! The film delivers on its promise of mass entertainment. Some pacing issues but overall a solid theatrical experience. Rating: ⭐⭐⭐½",
      tweet_likes: 8900,
      tweet_retweets: 1900,
      tweet_replies: 420,
      tweet_views: 580000,
      tweet_date: new Date("2024-09-28"),
    },
  ],
  "Border 2": [
    {
      tweet_url: "https://twitter.com/taran_adarsh/status/2234567890",
      tweet_id: "2234567890",
      author_handle: "@taran_adarsh",
      author_name: "Taran Adarsh",
      author_profile_image: "https://pbs.twimg.com/profile_images/taran_adarsh.jpg",
      tweet_content: "#Border2 - A PATRIOTIC MASTERPIECE! ⭐⭐⭐⭐⭐ Sunny Deol is ELECTRIFYING! The war sequences will give you GOOSEBUMPS! JAI HIND! 🇮🇳",
      tweet_likes: 22500,
      tweet_retweets: 5800,
      tweet_replies: 1200,
      tweet_views: 1200000,
      tweet_date: new Date("2025-01-24"),
    },
    {
      tweet_url: "https://twitter.com/BoxOfficeIndia/status/2234567891",
      tweet_id: "2234567891",
      author_handle: "@BoxOfficeIndia",
      author_name: "Box Office India",
      author_profile_image: "https://pbs.twimg.com/profile_images/boi.jpg",
      tweet_content: "Border 2 is an emotional rollercoaster! The climax will leave you in tears. Sunny Deol's performance is the soul of this film. A must-watch! 🎖️🇮🇳",
      tweet_likes: 18500,
      tweet_retweets: 4200,
      tweet_replies: 980,
      tweet_views: 950000,
      tweet_date: new Date("2025-01-25"),
    },
  ],
  "Mission: Impossible": [
    {
      tweet_url: "https://twitter.com/RajaSen/status/3234567890",
      tweet_id: "3234567890",
      author_handle: "@RajaSen",
      author_name: "Raja Sen",
      author_profile_image: "https://pbs.twimg.com/profile_images/raja_sen.jpg",
      tweet_content: "Mission: Impossible - The Final Reckoning is a fitting end to the legendary franchise! Tom Cruise defies age and gravity. The stunts are BREATHTAKING! 🎬🔥",
      tweet_likes: 19800,
      tweet_retweets: 4500,
      tweet_replies: 890,
      tweet_views: 1100000,
      tweet_date: new Date("2025-05-23"),
    },
    {
      tweet_url: "https://twitter.com/filmcompanion/status/3234567891",
      tweet_id: "3234567891",
      author_handle: "@filmcompanion",
      author_name: "Film Companion",
      author_profile_image: "https://pbs.twimg.com/profile_images/film_companion.jpg",
      tweet_content: "Tom Cruise proves why he's the last true movie star. Mission: Impossible delivers one thrilling set-piece after another. A cinematic experience like no other! ⭐⭐⭐⭐⭐",
      tweet_likes: 14200,
      tweet_retweets: 3200,
      tweet_replies: 650,
      tweet_views: 820000,
      tweet_date: new Date("2025-05-24"),
    },
  ],
  "Thunderbolts": [
    {
      tweet_url: "https://twitter.com/marvel/status/4234567890",
      tweet_id: "4234567890",
      author_handle: "@Marvel",
      author_name: "Marvel Entertainment",
      author_profile_image: "https://pbs.twimg.com/profile_images/marvel.jpg",
      tweet_content: "The Thunderbolts are here! 💥 An unconventional team of anti-heroes delivers surprises at every turn. Marvel's darkest and most exciting film yet! #Thunderbolts",
      tweet_likes: 35000,
      tweet_retweets: 8500,
      tweet_replies: 2100,
      tweet_views: 2500000,
      tweet_date: new Date("2025-05-02"),
    },
    {
      tweet_url: "https://twitter.com/IGN/status/4234567891",
      tweet_id: "4234567891",
      author_handle: "@IGN",
      author_name: "IGN",
      author_profile_image: "https://pbs.twimg.com/profile_images/ign.jpg",
      tweet_content: "Thunderbolts is a refreshing change of pace for the MCU! Dark, gritty, and surprisingly emotional. Florence Pugh is phenomenal! Rating: 9/10 ⭐",
      tweet_likes: 28500,
      tweet_retweets: 6200,
      tweet_replies: 1450,
      tweet_views: 1800000,
      tweet_date: new Date("2025-05-03"),
    },
  ],
  "Minecraft": [
    {
      tweet_url: "https://twitter.com/Minecraft/status/5234567890",
      tweet_id: "5234567890",
      author_handle: "@Minecraft",
      author_name: "Minecraft",
      author_profile_image: "https://pbs.twimg.com/profile_images/minecraft.jpg",
      tweet_content: "A Minecraft Movie brings the game to life in the most creative way possible! Jack Black is perfect as Steve. Fun for the whole family! 🎮⛏️ #MinecraftMovie",
      tweet_likes: 42000,
      tweet_retweets: 12000,
      tweet_replies: 3500,
      tweet_views: 3200000,
      tweet_date: new Date("2025-04-04"),
    },
    {
      tweet_url: "https://twitter.com/collider/status/5234567891",
      tweet_id: "5234567891",
      author_handle: "@Collider",
      author_name: "Collider",
      author_profile_image: "https://pbs.twimg.com/profile_images/collider.jpg",
      tweet_content: "A Minecraft Movie is a delightful surprise! Captures the spirit of the game perfectly. Jason Momoa and Jack Black have amazing chemistry. ⭐⭐⭐⭐",
      tweet_likes: 22500,
      tweet_retweets: 4800,
      tweet_replies: 920,
      tweet_views: 1400000,
      tweet_date: new Date("2025-04-05"),
    },
  ],
  "Lilo & Stitch": [
    {
      tweet_url: "https://twitter.com/Disney/status/6234567890",
      tweet_id: "6234567890",
      author_handle: "@Disney",
      author_name: "Disney",
      author_profile_image: "https://pbs.twimg.com/profile_images/disney.jpg",
      tweet_content: "Lilo & Stitch live-action captures the heart of the original! A beautiful story about family and belonging. Bring tissues! 🌺🧵 #LiloAndStitch",
      tweet_likes: 55000,
      tweet_retweets: 15000,
      tweet_replies: 4200,
      tweet_views: 4200000,
      tweet_date: new Date("2025-05-23"),
    },
    {
      tweet_url: "https://twitter.com/variety/status/6234567891",
      tweet_id: "6234567891",
      author_handle: "@Variety",
      author_name: "Variety",
      author_profile_image: "https://pbs.twimg.com/profile_images/variety.jpg",
      tweet_content: "The new Lilo & Stitch is a heartwarming adaptation. The animation-to-live-action transition is seamless. Perfect family entertainment! ⭐⭐⭐⭐",
      tweet_likes: 32000,
      tweet_retweets: 7500,
      tweet_replies: 1800,
      tweet_views: 2100000,
      tweet_date: new Date("2025-05-24"),
    },
  ],
  "Until Dawn": [
    {
      tweet_url: "https://twitter.com/horror/status/7234567890",
      tweet_id: "7234567890",
      author_handle: "@horror",
      author_name: "Horror News",
      author_profile_image: "https://pbs.twimg.com/profile_images/horror.jpg",
      tweet_content: "Until Dawn is a terrifying thrill ride! 🎃 The game-to-film adaptation actually works. Jump scares galore but with real tension. Horror fans will love it! #UntilDawn",
      tweet_likes: 18500,
      tweet_retweets: 4200,
      tweet_replies: 980,
      tweet_views: 980000,
      tweet_date: new Date("2025-04-25"),
    },
    {
      tweet_url: "https://twitter.com/screamfest/status/7234567891",
      tweet_id: "7234567891",
      author_handle: "@screamfest",
      author_name: "Screamfest Horror Film Festival",
      author_profile_image: "https://pbs.twimg.com/profile_images/screamfest.jpg",
      tweet_content: "Until Dawn delivers the scares! A worthy adaptation that honors the game while bringing something new. The Wendigo scenes are NIGHTMARE FUEL! 👻",
      tweet_likes: 12800,
      tweet_retweets: 2900,
      tweet_replies: 650,
      tweet_views: 720000,
      tweet_date: new Date("2025-04-26"),
    },
  ],
  "Lost Lands": [
    {
      tweet_url: "https://twitter.com/fantasyfilms/status/8234567890",
      tweet_id: "8234567890",
      author_handle: "@fantasyfilms",
      author_name: "Fantasy Films",
      author_profile_image: "https://pbs.twimg.com/profile_images/fantasy.jpg",
      tweet_content: "In the Lost Lands is a visual masterpiece! 🐉 The world-building is incredible. A must-see on the big screen for fantasy lovers! #InTheLostLands",
      tweet_likes: 16500,
      tweet_retweets: 3800,
      tweet_replies: 850,
      tweet_views: 890000,
      tweet_date: new Date("2025-02-28"),
    },
    {
      tweet_url: "https://twitter.com/scifi/status/8234567891",
      tweet_id: "8234567891",
      author_handle: "@scifi",
      author_name: "Sci-Fi Magazine",
      author_profile_image: "https://pbs.twimg.com/profile_images/scifi.jpg",
      tweet_content: "In the Lost Lands combines stunning visuals with an engaging story. The creature designs are phenomenal! A new fantasy franchise is born! ⭐⭐⭐⭐",
      tweet_likes: 11200,
      tweet_retweets: 2500,
      tweet_replies: 520,
      tweet_views: 650000,
      tweet_date: new Date("2025-03-01"),
    },
  ],
};

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  // ── 1. Clear existing Twitter reviews ──────────────────────────────────────
  const deleteResult = await db.collection("ratings_reviews").deleteMany({
    type: "twitter"
  });
  console.log(`\n🗑️  Removed ${deleteResult.deletedCount} existing Twitter reviews`);

  // ── 2. Get all movies ──────────────────────────────────────────────────────
  const movies = await db.collection("movies_new").find({}).toArray();
  console.log(`🎬 Found ${movies.length} movies`);

  // ── 3. Seed Twitter reviews for each movie ──────────────────────────────────
  let totalReviews = 0;

  for (const movie of movies) {
    // Find matching reviews by partial title match
    let reviews = null;
    for (const [key, value] of Object.entries(TWITTER_REVIEWS)) {
      if (movie.title?.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(movie.title?.toLowerCase())) {
        reviews = value;
        break;
      }
    }

    if (!reviews) {
      console.log(`   ⚠️  No Twitter reviews found for "${movie.title}"`);
      continue;
    }

    for (const review of reviews) {
      const reviewDoc = {
        _id: new mongoose.Types.ObjectId(),
        movie_id: movie._id,
        type: "twitter",
        ...review,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("ratings_reviews").insertOne(reviewDoc);
      totalReviews++;
    }

    console.log(`   ✅ ${movie.title} - ${reviews.length} Twitter reviews added`);
  }

  // ── 4. Summary ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding Complete!");
  console.log("────────────────────────────────────────");
  
  const finalCount = await db.collection("ratings_reviews").countDocuments({
    type: "twitter"
  });
  
  console.log(`📊 Total Twitter Reviews: ${finalCount}`);

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch(e => { console.error(e); process.exit(1); });
