import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";

const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const dbName = process.env.DB_NAME || "ticketflicks";

const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

const headers = { Authorization: `Bearer ${TMDB_API_KEY}` };

const manualMappings = {
    "devara: part 1": 1160018, // Devara Part 1
    "avengers: doomsday": 1000836,
    "mission: impossible – the final reckoning": 575264,
    "mission: impossible - the final reckoning": 575264
};

async function fetchTMDBMovie(title) {
    try {
        const lowerTitle = title.toLowerCase().trim();
        let movieId = manualMappings[lowerTitle];

        if (!movieId) {
            const fallbackQuery = title.split(":")[0];

            let searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}`, { headers });
            let match = searchRes.data.results?.[0];

            if (!match) {
                searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(fallbackQuery)}`, { headers });
                match = searchRes.data.results?.[0];
            }

            if (!match) return null;
            movieId = match.id;
        }

        const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, { headers });
        const details = detailsRes.data;

        return {
            poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : null,
            backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : null,
        };
    } catch (err) {
        return null;
    }
}

async function run() {
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;

        // 1. Movies 
        const movies = await db.collection("movies_new").find({}).toArray();
        for (const m of movies) {
            if (!m.poster_path || m.title.toLowerCase().includes("devara")) {
                const data = await fetchTMDBMovie(m.title);
                if (data && data.poster_path) {
                    await db.collection("movies_new").updateOne({ _id: m._id }, {
                        $set: {
                            poster_path: data.poster_path,
                            backdrop_path: data.backdrop_path,
                            posterUrl: data.poster_path, // Fallback
                            backdropUrl: data.backdrop_path // Fallback
                        }
                    });
                    console.log(`Updated Movie: ${m.title}`);
                } else {
                    console.log(`Still missing API data for Movie: ${m.title}`);
                }
            }
        }

        // 2. Upcoming Movies
        const upcomings = await db.collection("upcomingmovies").find({}).toArray();
        for (const m of upcomings) {
            if (!m.poster_path || !m.poster || m.title.toLowerCase().includes("devara")) {
                const data = await fetchTMDBMovie(m.title);
                if (data && data.poster_path) {
                    await db.collection("upcomingmovies").updateOne({ _id: m._id }, {
                        $set: {
                            poster_path: data.poster_path,
                            backdrop_path: data.backdrop_path,
                            poster: data.poster_path,
                            posterUrl: data.poster_path
                        }
                    });
                    console.log(`Updated Upcoming: ${m.title}`);
                } else {
                    console.log(`Still missing API data for Upcoming: ${m.title}`);
                }
            }
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
