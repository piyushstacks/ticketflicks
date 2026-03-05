import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/Booking.js";
import Show from "../models/show_tbls.js";

dotenv.config();

const bookingIds = [
    "69a54b5c442b1451606b555d",
    "69a7f0d6065c17c59119001b",
    "69a80158ef903b13a6931eea",
    "69a80158ef903b13a6931eee",
    "69a80158ef903b13a6931ef2"
];

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://piyushbhagchandani64:08P5NdHDb5F2CHc4@cluster99.57yjjst.mongodb.net/ticketflicks?retryWrites=true&w=majority");
        console.log("Connected to MongoDB.");

        let deletedCount = 0;

        for (const bId of bookingIds) {
            if (!mongoose.Types.ObjectId.isValid(bId)) {
                console.log(`Skipping invalid ID: ${bId}`);
                continue;
            }
            const booking = await Booking.findById(bId);
            if (!booking) {
                console.log(`Booking not found: ${bId}`);
                continue;
            }

            console.log(`Found booking ${bId} for show ${booking.show_id}`);

            const show = await Show.findById(booking.show_id);
            if (show) {
                console.log(`Found show ${show._id}, updating seats...`);
                let madeChanges = false;

                // Remove from bookedSeats
                if (show.bookedSeats && Array.isArray(show.bookedSeats)) {
                    const originalLen = show.bookedSeats.length;
                    show.bookedSeats = show.bookedSeats.filter(
                        bs => bs.bookingId?.toString() !== bId && (!bs.booking_id || bs.booking_id?.toString() !== bId)
                    );
                    if (show.bookedSeats.length !== originalLen) {
                        madeChanges = true;
                    }
                }

                // Remove from seatTiers -> occupiedSeats
                if (show.seatTiers && Array.isArray(show.seatTiers)) {
                    for (const seat of booking.seats_booked) {
                        const tier = show.seatTiers.find(t =>
                            t.name === seat.tierName || t.tierName === seat.tierName
                        );
                        if (tier && tier.occupiedSeats) {
                            if (tier.occupiedSeats[seat.seatNumber]) {
                                delete tier.occupiedSeats[seat.seatNumber];
                                madeChanges = true;
                            }
                        }
                    }
                    show.markModified("seatTiers");
                }

                if (madeChanges) {
                    await show.save();
                    console.log(`Updated show ${show._id}`);
                }
            }

            await Booking.findByIdAndDelete(bId);
            console.log(`Deleted booking ${bId}`);
            deletedCount++;
        }

        console.log(`Deleted ${deletedCount} bookings.`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

run();
