import mongoose from "mongoose";
import dotenv from "dotenv";

import NewMovie from "../models/Movie_new.js";

dotenv.config();

const checkMovies = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    console.log("\n📊 Checking movies_new collection...");
    const count = await NewMovie.countDocuments();
    console.log(`Total movies in new collection: ${count}`);

    if (count > 0) {
      const movies = await NewMovie.find().limit(5);
      console.log("\n🎬 Sample movies:");
      movies.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.title}`);
        console.log(`     - ID: ${m._id}`);
        console.log(`     - Description: ${m.description?.substring(0, 50)}...`);
        console.log(`     - Genre IDs: ${m.genre_ids?.length || 0}`);
        console.log(`     - Cast IDs: ${m.cast?.length || 0}`);
      });
    } else {
      console.log("\n⚠️ No movies found in new collection!");
    }

    // Also check old collection
    console.log("\n📊 Checking old movie_tbls collection...");
    const oldCount = await mongoose.connection.db.collection('movie_tbls').countDocuments();
    console.log(`Total movies in old collection: ${oldCount}`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
    process.exit(0);
  }
};

checkMovies();
