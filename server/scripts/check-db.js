import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');
    
    const totalTheatres = await Theatre.countDocuments();
    console.log('Total theatres:', totalTheatres);
    
    const theatresWithScreens = await Theatre.find({ screens: { $exists: true, $ne: [] } });
    console.log('Theatres with screens:', theatresWithScreens.length);
    
    if (theatresWithScreens.length > 0) {
      console.log('\nFirst theatre with screens:');
      console.log('ID:', theatresWithScreens[0]._id.toString());
      console.log('Name:', theatresWithScreens[0].name);
      console.log('Number of screens:', theatresWithScreens[0].screens.length);
      console.log('First screen:', theatresWithScreens[0].screens[0]);
    }
    
    // Check if there are any approved theatres
    const approvedTheatres = await Theatre.find({ approval_status: 'approved' });
    console.log('\nApproved theatres:', approvedTheatres.length);
    
    if (approvedTheatres.length > 0) {
      console.log('First approved theatre:', approvedTheatres[0]._id.toString(), approvedTheatres[0].name);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();