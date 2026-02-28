import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'ticketflicks' });
console.log('DB connected');

const { default: Show } = await import('./models/show_tbls.js');

// Find all shows missing showTime or startDate
const shows = await Show.find({
    $or: [
        { showTime: { $exists: false } },
        { showTime: null },
        { startDate: { $exists: false } },
        { startDate: null }
    ]
}).setOptions({ includeDeleted: false });

console.log(`Found ${shows.length} shows to backfill...`);
let updated = 0;

for (const show of shows) {
    const dt = new Date(show.showDateTime);
    // Use UTC hours since MongoDB stores in UTC
    const h = dt.getUTCHours().toString().padStart(2, '0');
    const m = dt.getUTCMinutes().toString().padStart(2, '0');
    const showTime = `${h}:${m}`;
    const dateStr = show.showDateTime.toISOString().split('T')[0]; // YYYY-MM-DD in UTC

    await Show.findByIdAndUpdate(
        show._id,
        { $set: { showTime, startDate: dateStr, endDate: dateStr } },
        { runValidators: false }
    );
    console.log(`  ✓ ${show._id}: showTime=${showTime}, date=${dateStr}`);
    updated++;
}

console.log(`\n✅ Backfilled ${updated} shows.`);
await mongoose.disconnect();
