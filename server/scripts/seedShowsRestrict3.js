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

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        const DB_NAME = process.env.DB_NAME || "ticketflicks";
        const uri = `${MONGODB_URI.replace(/\/$/, "")}/${DB_NAME}`;
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

        console.log("--- CLEANING EXISTING SHOWS ---");
        const deleteResult = await Show.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} old shows.`);

        const theatres = await Theatre.find({ disabled: false });
        const allMovies = await Movie.find({ status: "now_showing" });

        if (theatres.length === 0 || allMovies.length < 3) {
            console.error("Not enough theatres or now_showing movies in DB. Need at least 3 movies.");
            process.exit(1);
        }

        const showsToCreate = [];
        const requiredTotal = 100;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Required rule: "Each theatre should have shows for only 3 movies"
        // Let's assign exactly 3 movies to each theatre
        const theatreMoviesMap = {};

        for (const theatre of theatres) {
            const screens = await ScreenTbl.find({ theatre: theatre._id });
            if (screens.length === 0) continue;

            // Randomly select 3 unique movies for this theatre
            const shuffledMovies = [...allMovies].sort(() => 0.5 - Math.random());
            const selectedMovies = shuffledMovies.slice(0, 3);
            theatreMoviesMap[theatre._id] = selectedMovies;

            // "make sure every movie should have atleast one show in each theatre" -> wait, if each theatre ONLY has 3 movies, then not every movie can have a show in each theatre if there are 8 movies total.
            // Assumption: "every movie (of those 3) should have at least one show in each theatre"
            for (const movie of selectedMovies) {
                const screen = screens[Math.floor(Math.random() * screens.length)];

                let startD = new Date(today);
                startD.setDate(startD.getDate() - 1);
                let endD = new Date(startD);
                endD.setDate(endD.getDate() + 14);

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

        const remaining = requiredTotal - showsToCreate.length;
        if (remaining > 0) {
            console.log(`Created ${showsToCreate.length} base shows. Creating ${remaining} random shows...`);
            for (let i = 0; i < remaining; i++) {
                const theatre = theatres[i % theatres.length];
                const screens = await ScreenTbl.find({ theatre: theatre._id });
                if (screens.length === 0) continue;

                // Pick from the 3 assigned movies for this theatre
                const theatreMovies = theatreMoviesMap[theatre._id];
                const movie = theatreMovies[Math.floor(Math.random() * theatreMovies.length)];
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
                    language: "Hindi",
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
        }

        await Show.insertMany(showsToCreate);
        console.log(`Successfully seeded exactly ${showsToCreate.length} shows restricted to 3 movies per theatre.`);

        process.exit(0);
    } catch (error) {
        console.error("Script error:", error);
        process.exit(1);
    }
}

run();
