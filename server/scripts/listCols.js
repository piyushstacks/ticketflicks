import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'ticketflicks';
const uri = `${MONGODB_URI.replace(/\/$/, '')}/${DB_NAME}`;

async function run() {
    try {
        await mongoose.connect(uri);
        const cols = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in', DB_NAME, ':', cols.map(c => c.name).sort());
        process.exit(0);
    } catch (e) {
        console.error(e.message); process.exit(1);
    }
}
run();
