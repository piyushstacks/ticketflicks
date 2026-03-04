import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";

const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const dbName = process.env.DB_NAME || "ticketflicks";

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
}

if (!TMDB_API_KEY) {
    console.error("❌ TMDB_API_KEY not set in .env");
    process.exit(1);
}

// Build URI
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// Minimal inline schema
const movieSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Movie = mongoose.model("Movie", movieSchema, "movies_new");

const headers = { Authorization: `Bearer ${TMDB_API_KEY}` };

async function fetchTMDBMovie(title) {
    try {
        // Search
        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}`, { headers });
        const match = searchRes.data.results?.[0];

        if (!match) return null;

        const movieId = match.id;

        // Parallel fetch details, credits, and videos
        const [detailsRes, creditsRes, videosRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, { headers }),
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, { headers }),
            axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, { headers }),
        ]);

        const details = detailsRes.data;
        const credits = creditsRes.data;
        const videos = videosRes.data.results;

        const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos.find(v => v.site === "YouTube");
        const trailerLink = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

        const casts = (credits.cast || []).slice(0, 5).map(c => ({
            name: c.name,
            character: c.character,
            profile_path: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ""
        }));

        return {
            poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
            backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
            overview: details.overview,
            vote_average: details.vote_average,
            release_date: details.release_date,
            runtime: details.runtime,
            duration_min: details.runtime,
            genres: details.genres,
            casts: casts,
            trailer_link: trailerLink,
            trailer_path: trailerLink,
        };
    } catch (err) {
        console.error(`Error fetching TMDB data for "${title}":`, err.message);
        return null;
    }
}

async function run() {
    try {
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB:", mongoose.connection.db.databaseName);

        // Get all movies
        const movies = await Movie.find({});
        console.log(`Found ${movies.length} movies in the database. Fetching TMDB data...`);

        let updated = 0;

        for (const movie of movies) {
            console.log(`Processing "${movie.get('title')}"...`);

            // If the movie is a dummy test movie, skip to avoid weird matches
            if (movie.get('title').includes("Test") || movie.get('title') === "New Movie") {
                console.log(`⏭️  Skipping dummy movie "${movie.get('title')}"`);
                continue;
            }

            const tmdbData = await fetchTMDBMovie(movie.get('title'));

            if (tmdbData) {
                // If the poster path is already a TMDB link in DB, we could skip or just update. 
                // We'll update everything to make sure no fields are missing.
                await Movie.findByIdAndUpdate(movie._id, { $set: tmdbData }, { new: true });
                console.log(`✅ Updated data for "${movie.get('title')}"`);
                updated++;
            } else {
                console.log(`❌ No TMDB matches for "${movie.get('title')}"`);
            }
        }

        console.log(`\n🎉 Finished updating ${updated} movies!`);

    } catch (err) {
        console.error("Fatal error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
