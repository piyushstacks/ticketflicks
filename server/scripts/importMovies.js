import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';

// Load environment variables
dotenv.config();

// Dummy movie data from assets file
const dummyShowsData = [
    {
        "_id": "324544",
        "id": 324544,
        "title": "In the Lost Lands",
        "overview": "A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.",
        "poster_path": "https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 14, "name": "Fantasy" },
            { "id": 12, "name": "Adventure" }
        ],
        "release_date": "2025-02-27",
        "original_language": "en",
        "tagline": "She seeks the power to free her people.",
        "vote_average": 6.4,
        "runtime": 102
    },
    {
        "_id": "1232546",
        "id": 1232546,
        "title": "Until Dawn",
        "overview": "One year after her sister Melanie mysteriously disappeared, Clover and her friends head into the remote valley where she vanished in search of answers. Exploring an abandoned visitor center, they find themselves stalked by a masked killer and horrifically murdered one by one...only to wake up and find themselves back at the beginning of the same evening.",
        "poster_path": "https://image.tmdb.org/t/p/original/juA4IWO52Fecx8lhAsxmDgy3M3.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/icFWIk1KfkWLZnugZAJEDauNZ94.jpg",
        "genres": [
            { "id": 27, "name": "Horror" },
            { "id": 9648, "name": "Mystery" }
        ],
        "release_date": "2025-04-23",
        "original_language": "en",
        "tagline": "Every night a different nightmare.",
        "vote_average": 6.405,
        "runtime": 103
    },
    {
        "_id": "552524",
        "id": 552524,
        "title": "Lilo & Stitch",
        "overview": "The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to mend her broken family.",
        "poster_path": "https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg",
        "genres": [
            { "id": 10751, "name": "Family" },
            { "id": 35, "name": "Comedy" },
            { "id": 878, "name": "Science Fiction" }
        ],
        "release_date": "2025-05-17",
        "original_language": "en",
        "tagline": "Hold on to your coconuts.",
        "vote_average": 7.117,
        "runtime": 108
    },
    {
        "_id": "668489",
        "id": 668489,
        "title": "Havoc",
        "overview": "When a drug heist swerves lethally out of control, a jaded cop fights his way through a corrupt city's criminal underworld to save a politician's son.",
        "poster_path": "https://image.tmdb.org/t/p/original/ubP2OsF3GlfqYPvXyLw9d78djGX.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/65MVgDa6YjSdqzh7YOA04mYkioo.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 80, "name": "Crime" },
            { "id": 53, "name": "Thriller" }
        ],
        "release_date": "2025-04-25",
        "original_language": "en",
        "tagline": "No law. Only disorder.",
        "vote_average": 6.537,
        "runtime": 107
    },
    {
        "_id": "950387",
        "id": 950387,
        "title": "A Minecraft Movie",
        "overview": "Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they'll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.",
        "poster_path": "https://image.tmdb.org/t/p/original/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
        "genres": [
            { "id": 10751, "name": "Family" },
            { "id": 35, "name": "Comedy" },
            { "id": 12, "name": "Adventure" },
            { "id": 14, "name": "Fantasy" }
        ],
        "release_date": "2025-03-31",
        "original_language": "en",
        "tagline": "Be there and be square.",
        "vote_average": 6.516,
        "runtime": 101
    },
    {
        "_id": "575265",
        "id": 575265,
        "title": "Mission: Impossible - The Final Reckoning",
        "overview": "Ethan Hunt and team continue their search for the terrifying AI known as the Entity — which has infiltrated intelligence networks all over the globe — with the world's governments and a mysterious ghost from Hunt's past on their trail. Joined by new allies and armed with the means to shut the Entity down for good, Hunt is in a race against time to prevent the world as we know it from changing forever.",
        "poster_path": "https://image.tmdb.org/t/p/original/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/1p5aI299YBnqrEEvVGJERk2MXXb.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 12, "name": "Adventure" },
            { "id": 53, "name": "Thriller" }
        ],
        "release_date": "2025-05-17",
        "original_language": "en",
        "tagline": "Our lives are the sum of our choices.",
        "vote_average": 7.042,
        "runtime": 170
    },
    {
        "_id": "986056",
        "id": 986056,
        "title": "Thunderbolts*",
        "overview": "After finding themselves ensnared in a death trap, seven disillusioned castoffs must embark on a dangerous mission that will force them to confront the darkest corners of their pasts.",
        "poster_path": "https://image.tmdb.org/t/p/original/m9EtP1Yrzv6v7dMaC9mRaGhd1um.jpg",
        "backdrop_path": "https://image.tmdb.org/t/p/original/rthMuZfFv4fqEU4JVbgSW9wQ8rs.jpg",
        "genres": [
            { "id": 28, "name": "Action" },
            { "id": 878, "name": "Science Fiction" },
            { "id": 12, "name": "Adventure" }
        ],
        "release_date": "2025-04-30",
        "original_language": "en",
        "tagline": "Everyone deserves a second shot.",
        "vote_average": 7.443,
        "runtime": 127
    }
];

const importMovies = async () => {
  try {
    // Connect to MongoDB using cloud connection from .env
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri, {
      dbName: process.env.DB_NAME || 'ticketflicks'
    });
    console.log('Connected to MongoDB Cloud');

    // Clear existing movies (optional - remove this line if you want to keep existing data)
    // await Movie.deleteMany({});
    // console.log('Cleared existing movies');

    // Transform the dummy data to match our Movie model
    const moviesToInsert = dummyShowsData.map(movie => ({
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: new Date(movie.release_date),
      original_language: movie.original_language,
      tagline: movie.tagline,
      genres: movie.genres,
      casts: [], // We'll leave casts empty for now since the dummy data uses external references
      vote_average: movie.vote_average,
      runtime: movie.runtime,
      tmdbId: movie.id,
      isActive: true,
      addedByAdmin: null,
      theatres: [] // We'll leave theatres empty since they need to be added separately
    }));

    // Insert the movies
    const result = await Movie.insertMany(moviesToInsert);
    console.log(`Successfully imported ${result.length} movies`);
    
    // Show imported movies
    console.log('\nImported Movies:');
    result.forEach(movie => {
      console.log(`- ${movie.title} (${movie.release_date.getFullYear()}) - ID: ${movie._id}`);
    });

  } catch (error) {
    console.error('Error importing movies:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the import
importMovies();