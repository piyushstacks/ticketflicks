import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.VITE_MONGO_URI || process.env.MONGO_URI || "mongodb://localhost:27017/ticketflicks";

async function fixUsers() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);

        // We update all documents in the users_new collection that are missing 'phone' or 'password_hash'
        const db = mongoose.connection.db;
        const collection = db.collection('users_new');

        const result = await collection.updateMany(
            {
                $or: [
                    { phone: { $exists: false } },
                    { password_hash: { $exists: false } }
                ]
            },
            {
                $set: {
                    phone: "9999999999",
                    password_hash: "$2b$10$ZmKg56lXjvVLi39aqnsS.TJTRaVvh8QR2yqcnZChOx8gXkfPzkT0",
                    managedTheatreId: null,
                    favorites: [],
                    isDeleted: false,
                    __v: 0
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} users that were missing fields.`);
    } catch (err) {
        console.error("Error updating users:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

fixUsers();
