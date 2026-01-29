import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';

async function checkMigrationDB() {
  try {
    // Connect using the same URI as the migration script
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to migration database');
    
    // Check all theatres
    const allTheatres = await Theatre.find({});
    console.log('Total theatres in migration DB:', allTheatres.length);
    
    // Check theatres with screens
    const theatresWithScreens = await Theatre.find({ screens: { $exists: true, $ne: [] } });
    console.log('Theatres with screens in migration DB:', theatresWithScreens.length);
    
    // Show details of each theatre
    theatresWithScreens.forEach(theatre => {
      console.log(`- ${theatre.name} (${theatre._id}): ${theatre.screens.length} screens`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkMigrationDB();