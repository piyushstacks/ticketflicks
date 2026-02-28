import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'ticketflicks' });
console.log('DB connected');

const { default: User } = await import('./models/User.js');      // register User schema first
const { default: Theatre } = await import('./models/Theatre.js');
const { default: ScreenTbl } = await import('./models/ScreenTbl.js');

// Find all approved theatres with no screens
const theatres = await Theatre.find({ approval_status: 'approved' }).populate('manager_id', 'name _id');

console.log(`Checking ${theatres.length} approved theatres for missing screens...`);

for (const t of theatres) {
    const screenCount = await ScreenTbl.countDocuments({ theatre: t._id });
    if (screenCount === 0) {
        console.log(`  Theatre "${t.name}" (${t._id}) has NO screens — creating default Screen 1...`);
        await ScreenTbl.create({
            name: 'Screen 1',
            screenNumber: '1',
            theatre: t._id,
            seatLayout: {
                layout: Array.from({ length: 8 }, () => Array(12).fill('S')),
                rows: 8,
                seatsPerRow: 12,
                totalSeats: 96,
            },
            seatTiers: [
                { tierName: 'Standard', price: 150 },
                { tierName: 'Premium', price: 250 },
            ],
            isActive: true,
            status: 'active',
            createdBy: t.manager_id?._id || null,
        });
        console.log(`    ✓ Created default Screen 1 for "${t.name}"`);
    } else {
        console.log(`  Theatre "${t.name}" already has ${screenCount} screen(s) — skipping`);
    }
}

console.log('\n✅ Done!');
await mongoose.disconnect();
