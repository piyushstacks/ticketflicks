import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ShowTbls from './models/show_tbls.js';
import Movie from './models/Movie.js';

dotenv.config();

const testShows = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log('Connected to MongoDB Cloud');

    // Check total shows
    const totalShows = await ShowTbls.countDocuments();
    console.log('Total shows:', totalShows);

    // Check shows with future dates
    const futureShows = await ShowTbls.countDocuments({ 
      showDateTime: { $gte: new Date() } 
    });
    console.log('Future shows:', futureShows);

    // Check all shows with populated movies
    const show = await ShowTbls.find({})
      .populate('movie')
      .limit(5);
    
    console.log('Sample shows:');
    show.forEach((show, index) => {
      console.log(`Show ${index + 1}:`);
      console.log('  ID:', show._id);
      console.log('  DateTime:', show.showDateTime);
      console.log('  Movie:', show.movie ? show.movie.title : 'No movie populated');
      console.log('  Movie ID:', show.movie);
    });

    // Check if movies exist
    const totalMovies = await Movie.countDocuments();
    console.log('Total movies in movie_tbls:', totalMovies);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

testShows();