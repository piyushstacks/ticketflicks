/**
 * seedRealisticMovies.js
 * Seeds the movies_new collection with realistic, production-grade movie data.
 * Includes Bollywood, Tamil, Telugu, and Hollywood movies commonly shown in India.
 *
 * Usage: node server/scripts/seedRealisticMovies.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";

if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env");
    process.exit(1);
}

// Build URI exactly like db.js does — append DB name
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// Define a minimal inline schema to avoid circular imports
const movieSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Movie = mongoose.model("Movie", movieSchema, "movies_new");


const MOVIES = [
    {
        title: "Kalki 2898 AD",
        overview:
            "Set in the distant future, Kalki 2898 AD is an epic sci-fi action film that blends Hindu mythology with modern storytelling. A futuristic warrior is destined to protect a pregnant woman who carries the future of humanity.",
        description:
            "Set in the distant future, Kalki 2898 AD is an epic sci-fi action film that blends Hindu mythology with modern storytelling.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/iiNnJB7P7y6jsrJz0eHFITQhcjt.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/crRwmMrG7dASmjABaDqRhhpZGYF.jpg",
        trailer_link: "https://www.youtube.com/watch?v=Of8MFpADYiU",
        trailer_path: "https://www.youtube.com/watch?v=Of8MFpADYiU",
        release_date: new Date("2024-06-27"),
        runtime: 181,
        duration_min: 181,
        original_language: "te",
        genres: [
            { id: 28, name: "Action" },
            { id: 878, name: "Science Fiction" },
            { id: 18, name: "Drama" },
        ],
        vote_average: 7.5,
        imdbRating: 7.5,
        tagline: "The prophecy has arrived.",
        casts: [
            { name: "Prabhas", character: "Bhairava", profile_path: "https://image.tmdb.org/t/p/w185/mGVrXeIjyYTjHDb06NMuGP6GXBO.jpg" },
            { name: "Deepika Padukone", character: "Sumathi", profile_path: "https://image.tmdb.org/t/p/w185/k5CqM2hR5sMGGjmMoMkKXidWRar.jpg" },
            { name: "Amitabh Bachchan", character: "Ashwatthama", profile_path: "https://image.tmdb.org/t/p/w185/i3LRoACsJJwPOKHIDODTM83eYcF.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Stree 2",
        overview:
            "The gang from Chanderi is back to face a new supernatural threat that may be even more terrifying than Stree. Comedy-horror at its best, with unexpected twists and returns.",
        description:
            "The gang from Chanderi is back to face a new supernatural threat. Comedy-horror at its best with unexpected twists.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/gPbMHxRtWf7BDL2GFepKK0Y1u2t.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/sGQOhR7VrJk8wFOGJXCXLJMYPqT.jpg",
        trailer_link: "https://www.youtube.com/watch?v=vfPIbkF3uLI",
        trailer_path: "https://www.youtube.com/watch?v=vfPIbkF3uLI",
        release_date: new Date("2024-08-15"),
        runtime: 134,
        duration_min: 134,
        original_language: "hi",
        genres: [
            { id: 27, name: "Horror" },
            { id: 35, name: "Comedy" },
        ],
        vote_average: 8.2,
        imdbRating: 8.2,
        tagline: "Aayegi zaroor.",
        casts: [
            { name: "Rajkummar Rao", character: "Vicky", profile_path: "https://image.tmdb.org/t/p/w185/iuFNnqsiqm0d6J40OJlZpJtcq8o.jpg" },
            { name: "Shraddha Kapoor", character: "Stree", profile_path: "https://image.tmdb.org/t/p/w185/bBRFXvG9OtyS8Gj3z9WKWF6g7Iv.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Fighter",
        overview:
            "Squadron Leader Shamsher Pathania leads an elite unit of Indian Air Force officers on a mission to confront Pakistan-based terrorists responsible for attacks in India.",
        description:
            "An elite IAF unit led by Squadron Leader Shamsher Pathania takes on Pakistan-based terrorists in a high-octane aerial action film.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/tWIbVXVGMrBc5u7EJYUphB1VxHc.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/cFucpNUKHwLQi4BoiRfkqTLPrI0.jpg",
        trailer_link: "https://www.youtube.com/watch?v=vxuFkT6b9bY",
        trailer_path: "https://www.youtube.com/watch?v=vxuFkT6b9bY",
        release_date: new Date("2024-01-25"),
        runtime: 166,
        duration_min: 166,
        original_language: "hi",
        genres: [
            { id: 28, name: "Action" },
            { id: 18, name: "Drama" },
        ],
        vote_average: 6.8,
        imdbRating: 6.8,
        tagline: "Fearless. Limitless.",
        casts: [
            { name: "Hrithik Roshan", character: "Shamsher Pathania", profile_path: "https://image.tmdb.org/t/p/w185/kIJcJPcYT4XQIML3X9jl8oFBf8i.jpg" },
            { name: "Deepika Padukone", character: "Squadron Leader Minal Rathore", profile_path: "https://image.tmdb.org/t/p/w185/k5CqM2hR5sMGGjmMoMkKXidWRar.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Animal",
        overview:
            "A son becomes a violent and fiercely loyal figure in his quest to find the man who tried to murder his beloved father. A dark and gritty exploration of family, love, and obsession.",
        description:
            "Ranbir Kapoor plays a fiercely loyal son who undergoes a dramatic transformation after his beloved father is targeted for assassination.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/8kS3N2JdEA1Y3JYQB4LMGIoILu1.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        trailer_link: "https://www.youtube.com/watch?v=v9NUQT_Psy8",
        trailer_path: "https://www.youtube.com/watch?v=v9NUQT_Psy8",
        release_date: new Date("2023-12-01"),
        runtime: 201,
        duration_min: 201,
        original_language: "hi",
        genres: [
            { id: 28, name: "Action" },
            { id: 18, name: "Drama" },
            { id: 53, name: "Thriller" },
        ],
        vote_average: 6.9,
        imdbRating: 6.9,
        tagline: "Love. Rage. Revenge.",
        casts: [
            { name: "Ranbir Kapoor", character: "Ranvijay Singh", profile_path: "https://image.tmdb.org/t/p/w185/b0FtMhaSAKl55n2dGCGlsPhTczZ.jpg" },
            { name: "Rashmika Mandanna", character: "Geetanjali", profile_path: "https://image.tmdb.org/t/p/w185/ypR9I1xRLF3fDyPxQOEalSnHY55.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Pushpa: The Rule – Part 2",
        overview:
            "Pushpa Raj returns with an iron grip on the sandalwood trade and faces a fierce confrontation with SP Bhanwar Singh Shekawat in a battle for supremacy.",
        description:
            "Allu Arjun reprises his role as Pushpa Raj in this explosive sequel, facing a dangerous showdown with SP Bhanwar Singh Shekawat.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/9BPfblDq5IaXKOonJWqAIoTJKOH.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/b82nyg8grNWRJqJzHhKQlChRXJi.jpg",
        trailer_link: "https://www.youtube.com/watch?v=Q1GGMyKNS5M",
        trailer_path: "https://www.youtube.com/watch?v=Q1GGMyKNS5M",
        release_date: new Date("2024-12-05"),
        runtime: 190,
        duration_min: 190,
        original_language: "te",
        genres: [
            { id: 28, name: "Action" },
            { id: 80, name: "Crime" },
            { id: 18, name: "Drama" },
        ],
        vote_average: 8.0,
        imdbRating: 8.0,
        tagline: "Pushpa naam sunke flowers samjhe kya?",
        casts: [
            { name: "Allu Arjun", character: "Pushpa Raj", profile_path: "https://image.tmdb.org/t/p/w185/oCEqmdNjC3Vq1RTDI8bGqTgxGbM.jpg" },
            { name: "Rashmika Mandanna", character: "Srivalli", profile_path: "https://image.tmdb.org/t/p/w185/ypR9I1xRLF3fDyPxQOEalSnHY55.jpg" },
            { name: "Fahadh Faasil", character: "Bhanwar Singh Shekawat", profile_path: "https://image.tmdb.org/t/p/w185/dTi3gxmpf3jWYW2qVT0kzFsxqKl.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Devara: Part 1",
        overview:
            "A legendary man who once ruled the sea using nothing but fear, and his son must protect their village by emulating the same legend to survive.",
        description:
            "Jr. NTR plays a dual role as a legendary seafarer and his son who must rediscover the power of fear to save his community.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/sEBLJ7MtRVEnBcGi0WZ1M8kVLqM.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/aBWfYCrRUOPBmXgpTHQHFv0xXXK.jpg",
        trailer_link: "https://www.youtube.com/watch?v=DlmRF4dOLJ4",
        trailer_path: "https://www.youtube.com/watch?v=DlmRF4dOLJ4",
        release_date: new Date("2024-09-27"),
        runtime: 167,
        duration_min: 167,
        original_language: "te",
        genres: [
            { id: 28, name: "Action" },
            { id: 18, name: "Drama" },
        ],
        vote_average: 6.5,
        imdbRating: 6.5,
        tagline: "Fear is his weapon.",
        casts: [
            { name: "Jr. NTR", character: "Devara / Vara", profile_path: "https://image.tmdb.org/t/p/w185/vDdNfnAJ9eCYGkL4XscwjSoqOXO.jpg" },
            { name: "Janhvi Kapoor", character: "Thangam", profile_path: "https://image.tmdb.org/t/p/w185/xDYBKxjuqN2HEP1MNTvUXyNhH23.jpg" },
            { name: "Saif Ali Khan", character: "Bhaira", profile_path: "https://image.tmdb.org/t/p/w185/f7fmgXjvHqo4bkdUr6DyILZ7ytp.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Munjya",
        overview:
            "A folklore horror comedy about a mischievous supernatural entity called Munjya who develops an obsession with his descendant's girlfriend.",
        description:
            "A supernatural horror comedy rooted in Maharashtrian folklore. Munjya, a ghost from the past, creates chaos for his modern-day descendant.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/bPojdkCXU3s3CfqKLp3NG9MgPxo.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/3TYchCXW7HWTQJ2BbLhFHjFjHts.jpg",
        trailer_link: "https://www.youtube.com/watch?v=tgb6M4TdoQI",
        trailer_path: "https://www.youtube.com/watch?v=tgb6M4TdoQI",
        release_date: new Date("2024-06-07"),
        runtime: 142,
        duration_min: 142,
        original_language: "hi",
        genres: [
            { id: 27, name: "Horror" },
            { id: 35, name: "Comedy" },
        ],
        vote_average: 7.8,
        imdbRating: 7.8,
        tagline: "He never grows up.",
        casts: [
            { name: "Sharvari Wagh", character: "Bella", profile_path: "https://image.tmdb.org/t/p/w185/kXRYITUvxiRIKPHqRFLvOaQGxEh.jpg" },
            { name: "Abhay Verma", character: "Bittu", profile_path: "" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Singham Again",
        overview:
            "Bajirao Singham returns to take on a powerful new enemy, teaming up with other law enforcement officers in a high-stakes mission to rescue his wife.",
        description:
            "Bajirao Singham assembles an elite team to rescue his kidnapped wife from a villainous mastermind hell-bent on revenge.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/1T4CtXz3bDdSjiFbkjlbkdj5i3w.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/8iQbJEU3Ugjp9k7RuyUCpWgfwAI.jpg",
        trailer_link: "https://www.youtube.com/watch?v=Yz0e5VLTdN8",
        trailer_path: "https://www.youtube.com/watch?v=Yz0e5VLTdN8",
        release_date: new Date("2024-11-01"),
        runtime: 154,
        duration_min: 154,
        original_language: "hi",
        genres: [
            { id: 28, name: "Action" },
            { id: 80, name: "Crime" },
        ],
        vote_average: 6.2,
        imdbRating: 6.2,
        tagline: "The legend returns.",
        casts: [
            { name: "Ajay Devgn", character: "Bajirao Singham", profile_path: "https://image.tmdb.org/t/p/w185/jpMJkFtEk2apW0lGe4gNQthm9qx.jpg" },
            { name: "Deepika Padukone", character: "Shakti Shetty", profile_path: "https://image.tmdb.org/t/p/w185/k5CqM2hR5sMGGjmMoMkKXidWRar.jpg" },
            { name: "Ranveer Singh", character: "Sangram / Simmba", profile_path: "https://image.tmdb.org/t/p/w185/fW2R3LcJN3U5VnxpuqvmNSNgJt4.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "The Dark Knight",
        overview:
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        description:
            "Batman faces the Joker in this iconic superhero thriller set in Gotham City. Christopher Nolan's masterpiece.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
        trailer_link: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        trailer_path: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
        release_date: new Date("2008-07-18"),
        runtime: 152,
        duration_min: 152,
        original_language: "en",
        genres: [
            { id: 28, name: "Action" },
            { id: 80, name: "Crime" },
            { id: 18, name: "Drama" },
        ],
        vote_average: 9.0,
        imdbRating: 9.0,
        tagline: "Why so serious?",
        casts: [
            { name: "Christian Bale", character: "Bruce Wayne / Batman", profile_path: "https://image.tmdb.org/t/p/w185/qCpZn2e3dimwbryLnqxZuI88ptx.jpg" },
            { name: "Heath Ledger", character: "Joker", profile_path: "https://image.tmdb.org/t/p/w185/5Y9HnYYa9jF4NUnhaNHDAMSXGMQ.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "Interstellar",
        overview:
            "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival as Earth's resources run out.",
        description:
            "Matthew McConaughey leads a crew of astronauts through a wormhole in search of a new habitable world in Christopher Nolan's sci-fi epic.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg",
        trailer_link: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        trailer_path: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        release_date: new Date("2014-11-07"),
        runtime: 169,
        duration_min: 169,
        original_language: "en",
        genres: [
            { id: 12, name: "Adventure" },
            { id: 18, name: "Drama" },
            { id: 878, name: "Science Fiction" },
        ],
        vote_average: 8.7,
        imdbRating: 8.7,
        tagline: "Mankind was born on Earth. It was never meant to die here.",
        casts: [
            { name: "Matthew McConaughey", character: "Cooper", profile_path: "https://image.tmdb.org/t/p/w185/wJiGedOCZhwmx9DizKQKWeBKeXR.jpg" },
            { name: "Anne Hathaway", character: "Brand", profile_path: "https://image.tmdb.org/t/p/w185/lhKWMocJIg5dkgbANOkJxnq6CML.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "RRR",
        overview:
            "A fictional story about two legendary revolutionaries — Alluri Sitarama Raju and Komaram Bheem — and their journey away from home before they started fighting for their country.",
        description:
            "SS Rajamouli's epic period action film about two Indian freedom fighters who became unexpected friends and allies against the British colonial regime.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/6oaL4DP75yABrd5EbC4H2zq5ghc.jpg",
        trailer_link: "https://www.youtube.com/watch?v=OsU0CGZoV8E",
        trailer_path: "https://www.youtube.com/watch?v=OsU0CGZoV8E",
        release_date: new Date("2022-03-25"),
        runtime: 187,
        duration_min: 187,
        original_language: "te",
        genres: [
            { id: 28, name: "Action" },
            { id: 18, name: "Drama" },
            { id: 12, name: "Adventure" },
        ],
        vote_average: 7.9,
        imdbRating: 7.9,
        tagline: "Rise. Roar. Revolt.",
        casts: [
            { name: "N. T. Rama Rao Jr.", character: "Komaram Bheem", profile_path: "https://image.tmdb.org/t/p/w185/vDdNfnAJ9eCYGkL4XscwjSoqOXO.jpg" },
            { name: "Ram Charan", character: "A. Rama Raju", profile_path: "https://image.tmdb.org/t/p/w185/kGMkQKYQVCPxExmS0L7ckFDEcjr.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
    {
        title: "GOAT – Greatest of All Time",
        overview:
            "A retired special ops agent who has to come out of retirement to prevent a threat that involves his own son and a dark conspiracy from his past.",
        description:
            "Thalapathy Vijay plays a retired special agent who returns to action when his son gets embroiled in a deadly conspiracy.",
        poster_path:
            "https://image.tmdb.org/t/p/w500/tNkHcQcoMPVw3bqgRHdTmq7K2LG.jpg",
        backdrop_path:
            "https://image.tmdb.org/t/p/w1280/8mjYwWT50GkRrrRdyHzJordFbUw.jpg",
        trailer_link: "https://www.youtube.com/watch?v=uqDRvK-YYAE",
        trailer_path: "https://www.youtube.com/watch?v=uqDRvK-YYAE",
        release_date: new Date("2024-09-05"),
        runtime: 175,
        duration_min: 175,
        original_language: "ta",
        genres: [
            { id: 28, name: "Action" },
            { id: 53, name: "Thriller" },
        ],
        vote_average: 6.7,
        imdbRating: 6.7,
        tagline: "The greatest never retire.",
        casts: [
            { name: "Vijay", character: "Gandhi / Jeevan", profile_path: "https://image.tmdb.org/t/p/w185/2cFkVeNWVg2Qa1mKcRbmhHJIWBg.jpg" },
        ],
        isActive: true,
        isDeleted: false,
        reviewCount: 0,
        reviews: [],
    },
];

async function seed() {
    try {
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB:", mongoose.connection.db.databaseName);

        let added = 0;
        let skipped = 0;

        for (const movieData of MOVIES) {
            const existing = await Movie.findOne({ title: movieData.title });
            if (existing) {
                console.log(`⏭️  Skipped (already exists): ${movieData.title}`);
                skipped++;
                continue;
            }

            await Movie.create(movieData);
            console.log(`✅ Added: ${movieData.title}`);
            added++;
        }

        console.log(`\n🎬 Seeding complete! Added: ${added}, Skipped: ${skipped}`);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

seed();
