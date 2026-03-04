import mongoose from 'mongoose';
import dotenv from 'dotenv';
import process from 'process';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import ScreenTbl from '../models/ScreenTbl.js';
import Show from '../models/show_tbls.js';
import UpcomingMovie from '../models/UpcomingMovie.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'ticketflicks';
const uri = `${MONGODB_URI.replace(/\/$/, '')}/${DB_NAME}`;

const upcomingMoviesSeed = [
    {
        title: "Avengers: Doomsday",
        description: "The Avengers face their greatest threat yet as Doctor Doom unleashes a catastrophic plan that puts the entire universe at risk.",
        poster: "https://image.tmdb.org/t/p/w500/yA3wEdM872pXJ4b2d41hOtsH5M0.jpg",
        release_date: new Date("2026-05-02"),
        trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
        genres: ["Action", "Adventure", "Science Fiction"]
    },
    {
        title: "Mission: Impossible – The Final Reckoning",
        description: "Ethan Hunt returns for the ultimate chapter of his mission as the fate of the world hangs in the balance.",
        poster: "https://image.tmdb.org/t/p/w500/8qBylBsQf4llkGrEUG5xRGN0fJ0.jpg",
        release_date: new Date("2026-05-23"),
        trailer: "https://www.youtube.com/watch?v=2m1drlOZSDw",
        genres: ["Action", "Thriller", "Adventure"]
    },
    {
        title: "Spider-Man: Beyond the Spider-Verse",
        description: "Miles Morales returns in the next breathtaking chapter of the Oscar-winning Spider-Verse saga, facing impossible choices.",
        poster: "https://image.tmdb.org/t/p/w500/8b8R8l88ILjqZ2P6G7HxqCgJz0.jpg",
        release_date: new Date("2026-06-07"),
        trailer: "https://www.youtube.com/watch?v=shW9i6k8cB0",
        genres: ["Animation", "Action", "Adventure"]
    },
    {
        title: "The Batman Part II",
        description: "Bruce Wayne dons the cape once more as Gotham faces a new wave of terror orchestrated by a mysterious villain from his past.",
        poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        release_date: new Date("2026-10-03"),
        trailer: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
        genres: ["Action", "Crime", "Drama"]
    },
    {
        title: "Black Panther: Midnight Throne",
        description: "Shuri takes on a new legacy as Wakanda faces an unprecedented invasion from across the Multiverse.",
        poster: "https://image.tmdb.org/t/p/w500/sv1xJUazXeYqALzczSZ3O6nkH75.jpg",
        release_date: new Date("2026-11-13"),
        trailer: "https://www.youtube.com/watch?v=WpW36ldAqnM",
        genres: ["Action", "Adventure", "Science Fiction"]
    }
];

const SHOWTIMES = ["10:00", "13:00", "16:30", "19:00", "21:30"];

async function run() {
    try {
        await mongoose.connect(uri);
        console.log(`Connected to DB: ${DB_NAME}`);

        // ─── 1. Set all movies to now_showing with recent release dates ───────
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allMovies = await Movie.find({});
        console.log(`Found ${allMovies.length} movies. Setting them all to now_showing...`);
        for (let i = 0; i < allMovies.length; i++) {
            const movie = allMovies[i];
            const daysAgo = 7 + Math.floor(Math.random() * 21);
            const recentDate = new Date(today);
            recentDate.setDate(today.getDate() - daysAgo);
            movie.status = 'now_showing';
            movie.release_date = movie.release_date || recentDate;
            await movie.save();
        }
        console.log('All movies updated to now_showing.');

        // ─── 2. Seed Upcoming Movies ───────────────────────────────────────────
        await UpcomingMovie.deleteMany({});
        await UpcomingMovie.insertMany(upcomingMoviesSeed);
        console.log(`Seeded ${upcomingMoviesSeed.length} upcoming movies.`);

        // ─── 3. Clean and re-seed Shows ───────────────────────────────────────
        await Show.deleteMany({});
        console.log('Cleared all old shows.');

        const theatres = await Theatre.find({ disabled: false });
        if (theatres.length === 0) {
            console.error('No theatres found! Cannot seed shows.');
            process.exit(1);
        }

        const nowShowingMovies = await Movie.find({ status: 'now_showing', isActive: { $ne: false } });
        if (nowShowingMovies.length === 0) {
            console.error('No now_showing movies found!');
            process.exit(1);
        }
        console.log(`Seeding shows for ${nowShowingMovies.length} movies across ${theatres.length} theatres...`);

        const showsToInsert = [];
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14);

        // Ensure every movie gets at least one show in every theatre
        const theatreMoviesMap = {};
        for (const theatre of theatres) {
            const screens = await ScreenTbl.find({ theatre: theatre._id });
            if (screens.length === 0) continue;

            const shuffled = [...nowShowingMovies].sort(() => 0.5 - Math.random());
            const assignedMovies = shuffled.slice(0, Math.min(3, nowShowingMovies.length));
            theatreMoviesMap[theatre._id.toString()] = { theatre, screens, assignedMovies };

            for (const movie of assignedMovies) {
                const screen = screens[Math.floor(Math.random() * screens.length)];
                // Add 2 shows for today + tomorrow
                for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
                    const showDate = new Date(today);
                    showDate.setDate(today.getDate() + dayOffset);
                    const time = SHOWTIMES[Math.floor(Math.random() * SHOWTIMES.length)];
                    const [hh, mm] = time.split(':').map(Number);
                    showDate.setHours(hh, mm, 0, 0);

                    showsToInsert.push({
                        movie: movie._id,
                        theatre: theatre._id,
                        screen: screen._id,
                        showDateTime: showDate,
                        showTime: time,
                        startDate,
                        endDate,
                        language: 'English',
                        basePrice: 150,
                        seatTiers: [
                            { name: 'Standard', price: 150, color: '#4ade80', occupiedSeats: {} },
                            { name: 'Premium', price: 250, color: '#60a5fa', occupiedSeats: {} },
                            { name: 'VIP', price: 400, color: '#c084fc', occupiedSeats: {} }
                        ],
                        totalCapacity: 60,
                        totalSeats: 60,
                        bookedSeats: [],
                        status: 'available',
                        isActive: true,
                        isDeleted: false
                    });
                }
            }
        }

        // Fill up to 100 shows with random extras
        const theatreKeys = Object.keys(theatreMoviesMap);
        while (showsToInsert.length < 100 && theatreKeys.length > 0) {
            const key = theatreKeys[showsToInsert.length % theatreKeys.length];
            const { theatre, screens, assignedMovies } = theatreMoviesMap[key];
            const movie = assignedMovies[Math.floor(Math.random() * assignedMovies.length)];
            const screen = screens[Math.floor(Math.random() * screens.length)];

            const dayOffset = Math.floor(Math.random() * 12);
            const showDate = new Date(today);
            showDate.setDate(today.getDate() + dayOffset);
            const time = SHOWTIMES[Math.floor(Math.random() * SHOWTIMES.length)];
            const [hh, mm] = time.split(':').map(Number);
            showDate.setHours(hh, mm, 0, 0);

            showsToInsert.push({
                movie: movie._id,
                theatre: theatre._id,
                screen: screen._id,
                showDateTime: showDate,
                showTime: time,
                startDate,
                endDate,
                language: ['English', 'Hindi'][Math.floor(Math.random() * 2)],
                basePrice: 200,
                seatTiers: [
                    { name: 'Standard', price: 200, color: '#4ade80', occupiedSeats: {} },
                    { name: 'Premium', price: 300, color: '#60a5fa', occupiedSeats: {} },
                    { name: 'VIP', price: 500, color: '#c084fc', occupiedSeats: {} }
                ],
                totalCapacity: 60,
                totalSeats: 60,
                bookedSeats: [],
                status: 'available',
                isActive: true,
                isDeleted: false
            });
        }

        await Show.insertMany(showsToInsert.slice(0, 100));
        console.log(`Seeded ${Math.min(showsToInsert.length, 100)} shows successfully.`);

        // ─── Final counts ──────────────────────────────────────────────────────
        console.log('\n=== FINAL DB COUNTS ===');
        console.log(`Movies (now_showing): ${await Movie.countDocuments({ status: 'now_showing' })}`);
        console.log(`Shows: ${await Show.countDocuments()}`);
        console.log(`Upcoming Movies: ${await UpcomingMovie.countDocuments()}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
