import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';

// Load env
dotenv.config();

// Models
import Theatre from '../models/Theatre.js';
import Movie from '../models/Movie.js';
import ScreenTbl from '../models/ScreenTbl.js';
import Show from '../models/show_tbls.js';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/movieproj";

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");

        console.log("--- CLEANING EXISTING SHOWS ---");
        const deleteResult = await Show.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} old shows.`);

        const theatres = await Theatre.find({ disabled: false });
        const movies = await Movie.find({ status: "now_showing" });

        if (theatres.length === 0 || movies.length === 0) {
            console.error("Not enough theatres or now_showing movies in DB.");
            process.exit(1);
        }

        console.log(`Found ${theatres.length} Theatres and ${movies.length} Now Showing Movies.`);

        const showsToCreate = [];
        const requiredTotal = 100;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Required rule: "every movie should have atleast one show in each theatre"
        // Also: "Shows should only appear between startDate and endDate"
        for (const theatre of theatres) {
            const screens = await ScreenTbl.find({ theatre: theatre._id });
            if (screens.length === 0) continue;

            for (const movie of movies) {
                const screen = screens[Math.floor(Math.random() * screens.length)];

                const showLengthDays = 14;
                let startD = new Date(today);
                startD.setDate(startD.getDate() - 1); // Started yesterday
                let endD = new Date(startD);
                endD.setDate(endD.getDate() + showLengthDays); // Ends in 13 days

                let showTimeD = new Date(today);
                showTimeD.setHours(10 + Math.floor(Math.random() * 12), 0, 0, 0);

                showsToCreate.push({
                    movie: movie._id,
                    theatre: theatre._id,
                    screen: screen._id,
                    showDateTime: showTimeD,
                    showTime: `${showTimeD.getHours()}:00`,
                    startDate: startD,
                    endDate: endD,
                    language: "English",
                    basePrice: 150,
                    seatTiers: [
                        { name: "Standard", price: 150, color: "#4ade80", occupiedSeats: {} },
                        { name: "Premium", price: 250, color: "#60a5fa", occupiedSeats: {} },
                        { name: "VIP", price: 400, color: "#c084fc", occupiedSeats: {} }
                    ],
                    totalCapacity: 50,
                    totalSeats: 50,
                    bookedSeats: [],
                    status: "available",
                    isActive: true,
                    isDeleted: false
                });
            }
        }

        // We want exactly 100 shows total
        const remaining = requiredTotal - showsToCreate.length;
        if (remaining > 0) {
            console.log(`Created ${showsToCreate.length} base shows. Creating ${remaining} random shows...`);
            for (let i = 0; i < remaining; i++) {
                const theatre = theatres[i % theatres.length];
                const screens = await ScreenTbl.find({ theatre: theatre._id });
                if (screens.length === 0) continue;

                // For the extra shows, randomly pick one of the active movies
                const movie = movies[Math.floor(Math.random() * movies.length)];
                const screen = screens[Math.floor(Math.random() * screens.length)];

                // Set a show anywhere between today and 5 days from now
                const randomDayOffset = Math.floor(Math.random() * 6);
                let showTimeD = new Date(today);
                showTimeD.setDate(showTimeD.getDate() + randomDayOffset);
                showTimeD.setHours(10 + Math.floor(Math.random() * 12), 0, 0, 0);

                let startD = new Date(today);
                startD.setDate(startD.getDate() - 2);
                let endD = new Date(startD);
                endD.setDate(endD.getDate() + 10);

                showsToCreate.push({
                    movie: movie._id,
                    theatre: theatre._id,
                    screen: screen._id,
                    showDateTime: showTimeD,
                    showTime: `${showTimeD.getHours()}:00`,
                    startDate: startD,
                    endDate: endD,
                    language: "Hindi", // Some variation
                    basePrice: 200,
                    seatTiers: [
                        { name: "Standard", price: 200, color: "#4ade80", occupiedSeats: {} },
                        { name: "Premium", price: 300, color: "#60a5fa", occupiedSeats: {} },
                        { name: "VIP", price: 500, color: "#c084fc", occupiedSeats: {} }
                    ],
                    totalCapacity: 50,
                    totalSeats: 50,
                    bookedSeats: [],
                    status: "available",
                    isActive: true,
                    isDeleted: false
                });
            }
        } else if (remaining < 0) {
            // If base shows > 100 (which is unlikely if there are e.g. 3 theatres and 10 movies -> 30 shows)
            showsToCreate.length = requiredTotal;
        }

        await Show.insertMany(showsToCreate);
        console.log(`Successfully seeded exactly ${showsToCreate.length} shows.`);

        process.exit(0);
    } catch (error) {
        console.error("Script error:", error);
        process.exit(1);
    }
}

run();
