import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import User from '../models/User.js';
import ScreenTbl from '../models/ScreenTbl.js';

async function debugMigration() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');
    
    // Get our test theatre
    const theatre = await Theatre.findById('697b7e398e1404979c6db9f9');
    console.log('Test theatre:', theatre.name);
    console.log('Manager ID:', theatre.manager_id);
    
    // Check if manager exists
    const manager = await User.findById(theatre.manager_id);
    console.log('Manager found:', manager ? 'Yes' : 'No');
    if (manager) {
      console.log('Manager name:', manager.name);
      console.log('Manager role:', manager.role);
    }
    
    // Check if screens already exist
    const existingScreens = await ScreenTbl.find({ theatre: theatre._id });
    console.log('Existing screens in SCREEN_TBL:', existingScreens.length);
    
    // Try to migrate one screen manually
    if (theatre.screens.length > 0) {
      const screen = theatre.screens[0];
      console.log('First screen:', screen.name);
      
      const newScreen = new ScreenTbl({
        name: screen.name,
        screenNumber: screen.name.replace(/\D/g, '') || '1',
        theatre: theatre._id,
        seatLayout: {
          layout: screen.layout.layout || [],
          rows: screen.layout.rows || 0,
          seatsPerRow: screen.layout.seatsPerRow || 0,
          totalSeats: screen.layout.totalSeats || 0,
        },
        seatTiers: [], // We'll handle pricing separately
        isActive: screen.status === 'active',
        status: screen.status || 'active',
        createdBy: manager?._id,
        lastModifiedBy: manager?._id,
      });
      
      await newScreen.save();
      console.log('Manually migrated screen:', newScreen._id);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugMigration();