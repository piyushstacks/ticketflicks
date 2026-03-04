import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';

// Load env
dotenv.config();

// Models
import Theatre from '../models/Theatre.js';
import Movie from '../models/Movie.js';
import ScreenTbl from '../models/ScreenTbl.js';
import ShowTbls from '../models/show_tbls.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");

        console.log("--- CLEANING THEATRES ---");

        const realisticTheatres = [
            {
                name: "PVR Cinemas: Phoenix Palladium",
                city: "Mumbai",
                location: "Phoenix Palladium Mall, Lower Parel",
                status: "active",
                approval_status: "approved",
            },
            {
                name: "INOX: Nexus Mall",
                city: "Bangalore",
                location: "Nexus Mall, Koramangala",
                status: "active",
                approval_status: "approved",
            },
            {
                name: "Cinepolis: DLF Avenue",
                city: "Delhi",
                location: "DLF Avenue Saket",
                status: "active",
                approval_status: "approved",
            }
        ];

        // Find a manager user or create one
        let manager = await User.findOne({ role: "manager" });
        if (!manager) {
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.default.hash("password123", 10);

            manager = new User({
                name: "Test Manager",
                email: "manager@test.com",
                password_hash: hashedPassword,
                phone: "9999999999",
                role: "manager"
            });
            await manager.save();
            console.log("Created default manager: manager@test.com / password123");
        }

        let admin = await User.findOne({ role: "admin" });
        if (!admin) {
            const bcrypt = await import("bcryptjs");
            const hashedPassword = await bcrypt.default.hash("password123", 10);
            admin = new User({
                name: "Test Admin",
                email: "admin@test.com",
                password_hash: hashedPassword,
                phone: "8888888888",
                role: "admin"
            });
            await admin.save();
            console.log("Created default admin: admin@test.com / password123");
        }

        const managerId = manager._id;

        // Delete dummy theatres
        await Theatre.deleteMany({});
        await ScreenTbl.deleteMany({});
        await ShowTbls.deleteMany({});
        await Booking.deleteMany({});

        console.log("Deleted old dummy theatres, screens, shows, bookings.");

        for (const t of realisticTheatres) {
            const newTheatre = new Theatre({
                ...t,
                disabled: false,
                manager_id: managerId
            });
            await newTheatre.save();

            // Assign the first theatre natively to the manager for manager system
            if (!manager.managedTheatreId) {
                manager.managedTheatreId = newTheatre._id;
                await manager.save();
            }

            // Add 2 screens to each theatre
            for (let i = 1; i <= 2; i++) {
                const screen = new ScreenTbl({
                    name: `Screen ${i}`,
                    screenNumber: i.toString(),
                    theatre: newTheatre._id,
                    seatLayout: {
                        seatsPerRow: 10,
                        rows: 5,
                        totalSeats: 50,
                        layout: [
                            ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                            ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
                            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
                            ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R']
                        ]
                    },
                    seatTiers: [
                        { tierName: "Standard", price: 150 },
                        { tierName: "Premium", price: 250 },
                        { tierName: "Recliner", price: 400 }
                    ],
                    isActive: true,
                    createdBy: managerId,
                    lastModifiedBy: managerId
                });
                await screen.save();
            }
        }
        console.log("Created pure realistic theatres and screens.");

        console.log("--- UPDATING MOVIES ---");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const movies = await Movie.find({});
        console.log(`Found ${movies.length} movies to update.`);

        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];

            // Make half of them recent (Now Showing) and half future (Upcoming)
            if (i % 3 === 0) {
                const futureDate = new Date();
                futureDate.setDate(today.getDate() + 7 + (i % 5));
                await Movie.updateOne(
                    { _id: movie._id },
                    {
                        release_date: futureDate,
                        status: "upcoming"
                    }
                );
            } else {
                const pastDate = new Date();
                pastDate.setDate(today.getDate() - (i % 14));
                await Movie.updateOne(
                    { _id: movie._id },
                    {
                        release_date: pastDate,
                        status: "now_showing"
                    }
                );
            }
        }
        console.log("Movie dates and statuses updated successfully.");

        // Assign now_showing movies to all theatres
        const allTheatres = await Theatre.find({});
        const nowShowingMovies = await Movie.find({ status: "now_showing" });
        const nsIds = nowShowingMovies.map(m => m._id);

        for (const th of allTheatres) {
            th.movies = nsIds;
            await th.save();
        }

        for (const mov of nowShowingMovies) {
            mov.theatres = allTheatres.map(th => th._id);
            await mov.save();
        }
        console.log("Assigned Now Showing movies to Theatres.");

        console.log("Cleanup and Seed Complete.");
        process.exit(0);
    } catch (error) {
        console.error("Script error:", error);
        process.exit(1);
    }
}

run();
