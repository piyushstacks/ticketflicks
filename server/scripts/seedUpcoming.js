import mongoose from "mongoose";
import dotenv from "dotenv";
import process from "process";
import UpcomingMovie from "../models/UpcomingMovie.js";
import Movie from "../models/Movie.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const upcomingMoviesSeed = [
    {
        title: "Captain America: Brave New World",
        description: "Sam Wilson finds himself in the middle of an international incident and must discover the reason behind a nefarious global plot.",
        poster: "https://image.tmdb.org/t/p/w500/pz1pU5GslQ8nItoBweU1aHl6eP8.jpg",
        release_date: new Date("2026-05-01"),
        trailer: "https://www.youtube.com/watch?v=1pHDWnXmK7Y",
        genres: ["Action", "Adventure", "Science Fiction"]
    },
    {
        title: "Avengers: Doomsday",
        description: "The highly anticipated continuation of the Avengers saga.",
        poster: "https://image.tmdb.org/t/p/w500/yA3wEdM872pXJ4b2d41hOtsH5M0.jpg",
        release_date: new Date("2026-05-15"),
        trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
        genres: ["Action", "Adventure", "Science Fiction"]
    },
    {
        title: "Mission: Impossible - Dead Reckoning Part Two",
        description: "Ethan Hunt and his IMF team embark on their most dangerous mission yet.",
        poster: "https://image.tmdb.org/t/p/w500/8qBylBsQf4llkGrEUG5xRGN0fJ0.jpg",
        release_date: new Date("2026-06-25"),
        trailer: "https://www.youtube.com/watch?v=2m1drlOZSDw",
        genres: ["Action", "Thriller"]
    },
    {
        title: "Spider-Man: Beyond the Spider-Verse",
        description: "Miles Morales returns for the next chapter of the Oscar®-winning Spider-Verse saga.",
        poster: "https://image.tmdb.org/t/p/w500/8b8R8l88ILjqZ2P6G7HxqCgJz0.jpg",
        release_date: new Date("2026-07-20"),
        trailer: "https://www.youtube.com/watch?v=shW9i6k8cB0",
        genres: ["Animation", "Action", "Adventure"]
    }
];

async function run() {
    try {
        const DB_NAME = process.env.DB_NAME || "ticketflicks";
        const uri = `${MONGODB_URI.replace(/\/$/, "")}/${DB_NAME}`;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        await UpcomingMovie.deleteMany({});
        console.log("Deleted old upcoming movies");

        await UpcomingMovie.insertMany(upcomingMoviesSeed);
        console.log("Inserted new upcoming movies");

        // Also let's take ALL Movie entries that are "upcoming" and convert them or just remove them / update them to now_showing.
        const outdatedMovies = await Movie.updateMany({ status: "upcoming" }, { $set: { status: "now_showing", release_date: new Date() } });
        console.log(`Converted ${outdatedMovies.modifiedCount} old upcoming movies to now_showing.`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
