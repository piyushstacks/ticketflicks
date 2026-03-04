import mongoose from "mongoose";
import dotenv from "dotenv";
import process from "process";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Show from "../models/show_tbls.js";
import ScreenTbl from "../models/ScreenTbl.js";
import Theatre from "../models/Theatre.js";
import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

dotenv.config();

const DB_NAME = process.env.DB_NAME || "ticketflicks";
const uri = `${process.env.MONGODB_URI.replace(/\/$/, "")}/${DB_NAME}`;

const DEFAULT_PASSWORD = "Customer@123";

const INDIAN_NAMES = [
    { first: "Aarav", last: "Sharma" },
    { first: "Priya", last: "Patel" },
    { first: "Aditya", last: "Verma" },
    { first: "Neha", last: "Reddy" },
    { first: "Rohan", last: "Desai" }
];

async function run() {
    try {
        await mongoose.connect(uri);
        console.log(`Connected to DB: ${DB_NAME}\n`);

        // 1. DELETE UNUSED USERS & MANAGERS
        console.log("Cleaning up unused users...");
        const activeTheatres = await Theatre.find({ manager_id: { $ne: null } });
        const activeManagerIds = activeTheatres.map(t => t.manager_id);

        const admins = await User.find({ role: "admin" });
        const adminIds = admins.map(a => a._id);

        const usersToDeleteQuery = {
            _id: { $nin: [...activeManagerIds, ...adminIds] }
        };

        const usersToDelete = await User.find(usersToDeleteQuery);
        const userIdsToDelete = usersToDelete.map(u => u._id);

        console.log(`Found ${userIdsToDelete.length} unused or old users to delete.`);

        if (userIdsToDelete.length > 0) {
            const bookingsToDelete = await Booking.find({ user_id: { $in: userIdsToDelete } });
            const bookingIdsToDelete = bookingsToDelete.map(b => b._id);

            if (bookingIdsToDelete.length > 0) {
                await Payment.deleteMany({ booking_id: { $in: bookingIdsToDelete } });
                await Booking.deleteMany({ _id: { $in: bookingIdsToDelete } });
                console.log(`Deleted ${bookingIdsToDelete.length} bookings and their payments for the old users.`);
            }

            await User.deleteMany(usersToDeleteQuery);
            console.log(`Successfully deleted ${userIdsToDelete.length} old users.`);
        }

        // 2. CREATE 5 CUSTOMER USERS
        console.log("\nCreating 5 new customer users...");
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        const customers = [];

        for (let i = 0; i < 5; i++) {
            const p = INDIAN_NAMES[i];
            const suffix = Math.floor(Math.random() * 900) + 100; // Adds random numbers like 432
            const email = `${p.first.toLowerCase()}${p.last.toLowerCase()}${suffix}@gmail.com`;
            const name = `${p.first} ${p.last}`;

            const doc = await User.collection.insertOne({
                name,
                email,
                phone: `987654321${i}`,
                password_hash: hashedPassword,
                role: "customer",
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(`  ✅ Created customer: ${email}`);
            customers.push({ _id: doc.insertedId, name, email, phone: `987654321${i}` });
        }

        // 3. BOOK 2 RANDOM SHOWS FOR EACH CUSTOMER
        console.log("\nBooking 2 random shows for each customer...");

        const availableShows = await Show.find({
            isActive: true,
            showDateTime: { $gt: new Date() }
        }).populate("theatre").populate("movie").populate("screen").limit(50);

        if (availableShows.length === 0) {
            console.log("No available shows found to book. Please seed shows first.");
        } else {
            let bookingCount = 0;

            for (const customer of customers) {
                for (let j = 0; j < 2; j++) {
                    const randomShowIndex = Math.floor(Math.random() * availableShows.length);
                    const show = availableShows[randomShowIndex];

                    if (!show || !show.screen) continue;

                    const bookedSeats = show.bookedSeats || [];
                    let availableSeatCodes = [];

                    if (Array.isArray(show.screen.seatLayout)) {
                        const flatLayout = show.screen.seatLayout.flat();
                        for (const seat of flatLayout) {
                            if (seat && typeof seat === 'object' && seat.seatNumber && seat.tier && !bookedSeats.includes(seat.seatNumber)) {
                                availableSeatCodes.push({ seatNumber: seat.seatNumber, tier: seat.tier });
                                if (availableSeatCodes.length >= 2) break;
                            }
                        }
                    } else if (show.screen.seatLayout && show.screen.seatLayout.layout) {
                        const layout = show.screen.seatLayout.layout;
                        for (let r = 0; r < layout.length; r++) {
                            const rowLetter = String.fromCharCode(65 + r);
                            for (let c = 0; c < layout[r].length; c++) {
                                const seatType = layout[r][c];
                                if (seatType && seatType !== '') {
                                    const seatLabel = `${rowLetter}${c + 1}`;
                                    if (!bookedSeats.includes(seatLabel)) {
                                        availableSeatCodes.push({ seatNumber: seatLabel, tier: seatType });
                                        if (availableSeatCodes.length >= 2) break;
                                    }
                                }
                            }
                            if (availableSeatCodes.length >= 2) break;
                        }
                    }

                    if (availableSeatCodes.length < 2) continue;

                    let totalAmount = 0;
                    const tierNames = show.pricing || [];

                    const bookingSeatsArr = [];
                    for (const s of availableSeatCodes) {
                        const pricingTier = tierNames.find(t => t.name === s.tier) || { price: 250 };
                        const seatPrice = Number(pricingTier.price || 250);
                        totalAmount += seatPrice;
                        bookingSeatsArr.push({
                            seatNumber: s.seatNumber,
                            tierName: s.tier,
                            price: seatPrice
                        });
                    }

                    totalAmount += 50; // convenience fee

                    const booking = new Booking({
                        user_id: customer._id,
                        show_id: show._id,
                        seats_booked: bookingSeatsArr,
                        total_amount: totalAmount,
                        status: "confirmed",
                        payment_status: "completed",
                        payment_method: "stripe",
                        payment_id: "pi_stripe_mock_" + Math.floor(Math.random() * 10000000)
                    });
                    await booking.save();

                    const payment = new Payment({
                        booking_id: booking._id,
                        user_id: customer._id,
                        amount: totalAmount,
                        method: "card",
                        status: "success",
                        transaction_id: booking.payment_id
                    });
                    await payment.save();

                    await Show.findByIdAndUpdate(show._id, {
                        $push: { bookedSeats: { $each: [availableSeatCodes[0].seatNumber, availableSeatCodes[1].seatNumber] } }
                    });

                    bookingCount++;
                }
            }
            console.log(`✅ Successfully created ${bookingCount} bookings across the new customers.`);
        }

        console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
        console.log("║       NEW CUSTOMER LOGIN CREDENTIALS                                 ║");
        console.log("╠══════════════════════════════════════════════════════════════════════╣");
        customers.forEach((c, i) => {
            console.log(`║  ${String(i + 1).padEnd(3)} ${c.name.padEnd(61)} ║`);
            console.log(`║       Email    : ${c.email.padEnd(50)} ║`);
            console.log(`║       Password : ${DEFAULT_PASSWORD.padEnd(50)} ║`);
            console.log("╠══════════════════════════════════════════════════════════════════════╣");
        });
        console.log("╚══════════════════════════════════════════════════════════════════════╝");

        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

run();
