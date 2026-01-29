import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import youtubeService from '../services/youtubeService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fetchTrailersForAllMovies = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all movies without trailers or with invalid trailers
    const movies = await Movie.find({
      $or: [
        { trailer_path: { $exists: false } },
        { trailer_path: { $in: ['', null] } },
        { trailer_path: { $regex: /^(?!https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).*)$/ } }
      ]
    });

    console.log(`Found ${movies.length} movies without valid trailers`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const movie of movies) {
      try {
        console.log(`Processing: ${movie.title}`);
        
        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
        const trailerUrl = await youtubeService.searchMovieTrailer(movie.title, year);
        
        if (trailerUrl) {
          await Movie.findByIdAndUpdate(movie._id, { 
            trailer_path: trailerUrl 
          });
          console.log(`✅ Updated trailer for: ${movie.title}`);
          updatedCount++;
        } else {
          console.log(`❌ No trailer found for: ${movie.title}`);
          failedCount++;
        }

        // Add delay to avoid YouTube API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error processing ${movie.title}:`, error);
        failedCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`✅ Successfully updated: ${updatedCount} movies`);
    console.log(`❌ Failed to update: ${failedCount} movies`);
    console.log(`Total processed: ${movies.length} movies`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
fetchTrailersForAllMovies();
