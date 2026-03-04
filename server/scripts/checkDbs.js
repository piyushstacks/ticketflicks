import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import ScreenTbl from '../models/ScreenTbl.js';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'ticketflicks';
const uri = `${process.env.MONGODB_URI.replace(/\/$/, '')}/${DB_NAME}`;

async function run() {
    try {
        await mongoose.connect(uri);
        const screens = await ScreenTbl.find({}).limit(5);
        console.log(screens.map(s => ({ name: s.name, isActive: s.isActive, status: s.status })));

        const countWithActive = await ScreenTbl.countDocuments({ isActive: true });
        const countTotal = await ScreenTbl.countDocuments();
        console.log('Total screens:', countTotal);
        console.log('Total screens with isActive=true:', countWithActive);

        process.exit(0);
    } catch (e) { console.error(e.message); process.exit(1); }
}
run();
