import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import { fetchShows } from '../controllers/showController.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);

        const req = {};
        const res = {
            json: (data) => {
                console.log("Response from showController.fetchShows:", JSON.stringify(data, null, 2));
            }
        };

        await fetchShows(req, res, (err) => {
            if (err) console.error("Error passed to next:", err);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
