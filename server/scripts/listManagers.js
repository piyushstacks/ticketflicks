import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import bcrypt from 'bcryptjs';
import Theatre from '../models/Theatre.js';
import User from '../models/User.js';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'ticketflicks';
const uri = `${process.env.MONGODB_URI.replace(/\/$/, '')}/${DB_NAME}`;

const DEFAULT_PASSWORD = 'Manager@123';

async function run() {
    try {
        await mongoose.connect(uri);
        console.log(`Connected to DB: ${DB_NAME}\n`);

        const theatres = await Theatre.find({ approval_status: 'approved' }).sort({ name: 1 });
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        const results = [];

        for (const theatre of theatres) {
            const slug = theatre.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .slice(0, 14);
            const email = `mgr.${slug}@ticketflicks.com`;

            // Try to find by email. If found, update. Otherwise create using raw MongoDB op
            // to bypass Mongoose validators (phone is required but we don't have real phones)
            let manager = await User.findOne({ email }).select('+password_hash');

            if (!manager) {
                // Direct insert using mongoose model with runValidators: false
                const doc = await User.collection.insertOne({
                    name: `Manager — ${theatre.name}`,
                    email,
                    phone: '0000000000', // placeholder to satisfy required field
                    password_hash: hashedPassword,
                    role: 'manager',
                    isDeleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                manager = { _id: doc.insertedId, email };
                console.log(`  ✅ Created: ${email}`);
            } else {
                // Reset password — update password_hash directly
                await User.collection.updateOne(
                    { _id: manager._id },
                    { $set: { password_hash: hashedPassword, role: 'manager', phone: manager.phone || '0000000000' } }
                );
                console.log(`  🔄 Reset:   ${email}`);
            }

            // Assign manager to theatre using direct update
            await Theatre.collection.updateOne(
                { _id: theatre._id },
                { $set: { manager_id: manager._id } }
            );

            results.push({
                theatre: theatre.name,
                city: theatre.city || '—',
                email,
                password: DEFAULT_PASSWORD,
                managerId: manager._id.toString(),
            });
        }

        console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
        console.log('║       MANAGER LOGIN CREDENTIALS — ALL THEATRES                      ║');
        console.log('╠══════════════════════════════════════════════════════════════════════╣');
        results.forEach((r, i) => {
            console.log(`║  ${String(i + 1).padEnd(3)} ${r.theatre.slice(0, 36).padEnd(36)}  ${r.city.slice(0, 10).padEnd(10)} ║`);
            console.log(`║       Email    : ${r.email.padEnd(50)} ║`);
            console.log(`║       Password : ${r.password.padEnd(50)} ║`);
            console.log('╠══════════════════════════════════════════════════════════════════════╣');
        });
        console.log('╚══════════════════════════════════════════════════════════════════════╝');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
