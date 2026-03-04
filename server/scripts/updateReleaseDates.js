import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import Movie from '../models/Movie.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        const DB_NAME = process.env.DB_NAME || "ticketflicks";
        const uri = `${MONGODB_URI.replace(/\/$/, "")}/${DB_NAME}`;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const nowShowingMovies = await Movie.find({ status: "now_showing" });
        console.log(`Updating release dates for ${nowShowingMovies.length} now_showing movies.`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < nowShowingMovies.length; i++) {
            const movie = nowShowingMovies[i];

            // Generate a random date between 7 to 30 days ago to simulate re-releases or recent releases
            const daysAgo = Math.floor(Math.random() * 24) + 7;
            const recentDate = new Date(today);
            recentDate.setDate(today.getDate() - daysAgo);

            movie.release_date = recentDate;
            await movie.save();
        }

        console.log("Release dates updated for now_showing movies.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
