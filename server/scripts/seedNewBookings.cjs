require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users_new');

const bookingSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Booking = mongoose.model('Booking', bookingSchema, 'bookings_new');

async function seedData() {
    const uri = process.env.MONGODB_URI + '/' + (process.env.DB_NAME || 'ticketflicks');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    try {
        // 1. Create 5 Users
        console.log('Seeding 5 new customers...');
        const usersToInsert = [];
        const names = ['Aarav Sharma', 'Diya Patel', 'Rohan Gupta', 'Neha Singh', 'Kabir Verma'];

        for (let i = 0; i < 5; i++) {
            usersToInsert.push({
                name: names[i],
                email: `customer${Math.floor(Math.random() * 10000)}@example.com`,
                role: 'customer',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        let insertedUsers = [];
        if (usersToInsert.length > 0) {
            const result = await db.collection('users_new').insertMany(usersToInsert);
            for (let idx in result.insertedIds) {
                insertedUsers.push({ _id: result.insertedIds[idx], ...usersToInsert[idx] });
            }
        }

        // 2. Fetch 5 Random Shows across different theatres
        console.log('Fetching random shows...');
        const shows = await db.collection('shows_new').aggregate([
            { $sample: { size: 5 } }
        ]).toArray();

        if (shows.length === 0) {
            console.log('No shows available to book!');
            process.exit(1);
        }

        // 3. Create Bookings
        console.log('Creating 5 bookings...');
        const bookingsToInsert = [];

        for (let i = 0; i < 5; i++) {
            const user = insertedUsers[i];
            const show = shows[i % shows.length]; // cycle if less than 5 shows

            // Random amount between 300 and 1500
            const amount = Math.floor(Math.random() * 1200) + 300;

            // Random date within the last 7 days to give a trend line
            const date = new Date();
            date.setDate(date.getDate() - i);

            bookingsToInsert.push({
                user_id: user._id,
                show_id: show._id,
                movie_id: show.movie,
                theatre_id: show.theatre,
                screen_id: show.screen,
                status: 'confirmed',
                isPaid: true,
                seats_booked: [
                    { seatNumber: 'A1', price: amount / 2 },
                    { seatNumber: 'A2', price: amount / 2 }
                ],
                total_amount: amount,
                amount: amount,
                createdAt: date,
                updatedAt: date
            });
        }

        if (bookingsToInsert.length > 0) {
            await db.collection('bookings_new').insertMany(bookingsToInsert);
            console.log('✅ 5 bookings successfully created.');
        }

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedData();
