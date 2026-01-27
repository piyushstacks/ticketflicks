import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Backfill script to assign existing movies to all active theatres
 * Run this once after implementing auto-assignment feature
 */

async function backfillMovieAssignments() {
    try {
        console.log("🚀 Starting movie assignment backfill...\n");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // Get all active theatres
        const allTheatres = await Theatre.find({
            approval_status: "approved",
            disabled: false,
        });

        console.log(`📍 Found ${allTheatres.length} active theatres\n`);

        if (allTheatres.length === 0) {
            console.log("⚠️  No active theatres found. Exiting...");
            process.exit(0);
        }

        // Get all active movies
        const allMovies = await Movie.find({ isActive: true });
        console.log(`🎬 Found ${allMovies.length} active movies\n`);

        if (allMovies.length === 0) {
            console.log("⚠️  No active movies found. Exiting...");
            process.exit(0);
        }

        let updatedMovies = 0;
        let updatedTheatres = 0;

        // For each movie, assign to all theatres
        for (const movie of allMovies) {
            console.log(`Processing: "${movie.title}"...`);

            // Add all theatre IDs to movie.theatres (avoid duplicates)
            const existingTheatres = new Set(movie.theatres.map((t) => t.toString()));
            let addedToMovie = 0;

            for (const theatre of allTheatres) {
                if (!existingTheatres.has(theatre._id.toString())) {
                    movie.theatres.push(theatre._id);
                    addedToMovie++;
                }
            }

            if (addedToMovie > 0) {
                await movie.save();
                updatedMovies++;
                console.log(`  ✓ Added to ${addedToMovie} theatres`);
            } else {
                console.log(`  → Already assigned to all theatres`);
            }
        }

        console.log("\n");

        // For each theatre, add all movies to their movies array
        for (const theatre of allTheatres) {
            console.log(`Processing theatre: "${theatre.name}"...`);

            // Initialize movies array if it doesn't exist
            if (!theatre.movies) {
                theatre.movies = [];
            }

            const existingMovies = new Set(theatre.movies.map((m) => m.toString()));
            let addedToTheatre = 0;

            for (const movie of allMovies) {
                if (!existingMovies.has(movie._id.toString())) {
                    theatre.movies.push(movie._id);
                    addedToTheatre++;
                }
            }

            if (addedToTheatre > 0) {
                await theatre.save();
                updatedTheatres++;
                console.log(`  ✓ Added ${addedToTheatre} movies`);
            } else {
                console.log(`  → Already has all movies`);
            }
        }

        console.log("\n");
        console.log("=".repeat(50));
        console.log("✅ Backfill completed successfully!");
        console.log("=".repeat(50));
        console.log(`📊 Summary:`);
        console.log(`   - Movies updated: ${updatedMovies}/${allMovies.length}`);
        console.log(`   - Theatres updated: ${updatedTheatres}/${allTheatres.length}`);
        console.log(`   - Total assignments: ${allMovies.length * allTheatres.length}`);
        console.log("=".repeat(50));

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error during backfill:", error);
        process.exit(1);
    }
}

// Run the script
backfillMovieAssignments();
