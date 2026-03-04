import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import { fetchShows, fetchUpcomingMovies, getAvailableMoviesForCustomers } from '../services/showService.js';
import Show from '../models/show_tbls.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const shows = await fetchShows();
        console.log("Returned by fetchShows():", shows.length);
        if (shows.length > 0) {
            console.log(shows[0].title);
        }

        const upcoming = await fetchUpcomingMovies();
        console.log("Returned by fetchUpcomingMovies():", upcoming.length);

        const available = await getAvailableMoviesForCustomers();
        console.log("Returned by getAvailableMoviesForCustomers():", available.count);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
