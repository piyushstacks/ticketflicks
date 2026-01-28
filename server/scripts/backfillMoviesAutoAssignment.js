import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import User from "../models/User.js";

dotenv.config();

const backfillMoviesAutoAssignment = async () => {
  try {
    console.log("🎬 Starting movie auto-assignment backfill...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all active theatres
    const activeTheatres = await Theatre.find({ disabled: false });
    const theatreIds = activeTheatres.map(theatre => theatre._id);
    
    console.log(`Found ${activeTheatres.length} active theatres`);

    // Get the first admin user to assign as the creator
    const adminUser = await User.findOne({ role: "admin" });
    const addedByAdmin = adminUser ? adminUser._id : null;
    
    if (!adminUser) {
      console.warn("⚠️  No admin user found. Movies will be created without addedByAdmin field.");
    }

    // Find all movies that don't have the new fields
    const moviesToUpdate = await Movie.find({
      $or: [
        { excludedTheatres: { $exists: false } },
        { addedByAdmin: { $exists: false } },
        { theatres: { $exists: false } }
      ]
    });

    console.log(`Found ${moviesToUpdate.length} movies to update`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const movie of moviesToUpdate) {
      try {
        // Check if movie already has theatres assigned (manual assignment)
        const hasManualAssignment = movie.theatres && movie.theatres.length > 0;
        
        // Prepare update data
        const updateData = {
          excludedTheatres: [],
          addedByAdmin: addedByAdmin || movie.addedByAdmin || null,
        };

        // Auto-assign to all theatres only if no manual assignment exists
        if (!hasManualAssignment) {
          updateData.theatres = theatreIds;
          console.log(`🎞️  Auto-assigning "${movie.title}" to ${theatreIds.length} theatres`);
        } else {
          console.log(`⏭️  Skipping "${movie.title}" - already has ${movie.theatres.length} theatres assigned`);
          skippedCount++;
        }

        // Update the movie
        await Movie.findByIdAndUpdate(movie._id, updateData);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Error updating movie "${movie.title}":`, error.message);
      }
    }

    console.log("\n📊 Backfill Summary:");
    console.log(`✅ Updated: ${updatedCount} movies`);
    console.log(`⏭️  Skipped: ${skippedCount} movies (already had theatre assignments)`);
    console.log(`🎬 Total processed: ${moviesToUpdate.length} movies`);

    // Update theatre movies array for auto-assigned movies
    console.log("\n🔄 Updating theatre movie references...");
    
    const autoAssignedMovies = await Movie.find({ 
      theatres: { $in: theatreIds },
      excludedTheatres: [] 
    });

    for (const theatre of activeTheatres) {
      const moviesForThisTheatre = autoAssignedMovies.filter(movie => 
        movie.theatres.includes(theatre._id)
      );
      
      if (moviesForThisTheatre.length > 0) {
        const movieIds = moviesForThisTheatre.map(movie => movie._id);
        await Theatre.findByIdAndUpdate(theatre._id, {
          $addToSet: { movies: { $each: movieIds } }
        });
        console.log(`✅ Added ${moviesForThisTheatre.length} movies to theatre "${theatre.name}"`);
      }
    }

    console.log("\n✅ Backfill completed successfully!");
    
  } catch (error) {
    console.error("❌ Backfill failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the backfill
backfillMoviesAutoAssignment();