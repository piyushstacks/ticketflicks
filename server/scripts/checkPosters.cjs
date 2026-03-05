require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function checkMovies() {
    const uri = process.env.MONGODB_URI + '/' + (process.env.DB_NAME || 'ticketflicks');
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const movies = await db.collection('movies_new').find({}, { projection: { title: 1, posterUrl: 1, backdropUrl: 1 } }).toArray();
    const up = await db.collection('upcomingmovies').find({}, { projection: { title: 1, posterUrl: 1, backdropUrl: 1 } }).toArray();

    console.log('--- MOVIES NEW (Missing Posters or Devara) ---');
    movies.forEach(m => {
        if (!m.posterUrl || !m.backdropUrl || m.title.toLowerCase().includes('devara')) {
            console.log(m.title, 'Poster:', m.posterUrl, 'Backdrop:', m.backdropUrl);
        }
    });

    console.log('--- UPCOMING (Missing Posters or Devara) ---');
    up.forEach(m => {
        if (!m.posterUrl || !m.backdropUrl || m.title.toLowerCase().includes('devara')) {
            console.log(m.title, 'Poster:', m.posterUrl, 'Backdrop:', m.backdropUrl);
        }
    });
    process.exit(0);
}

checkMovies().catch(console.error);
