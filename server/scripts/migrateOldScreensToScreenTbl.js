import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Screen from '../models/Screen.js';
import ScreenTbl from '../models/ScreenTbl.js';

const migrateOldScreensToScreenTbl = async () => {
  try {
    console.log('🔄 Starting old Screen migration to SCREEN_TBL...');
    
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'ticketflicks';
    
    await mongoose.connect(mongoURI, {
      dbName: dbName,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const oldScreens = await Screen.find({});
    console.log(`📊 Found ${oldScreens.length} old screens`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    
    for (const screen of oldScreens) {
      // Check if screen already exists in SCREEN_TBL by ID or name/theatre
      const existingScreen = await ScreenTbl.findOne({
        $or: [
          { _id: screen._id },
          { name: screen.name, theatre: screen.theatre }
        ]
      });
      
      if (existingScreen) {
        console.log(`⏭️  Screen "${screen.name}" (${screen._id}) already exists in SCREEN_TBL, skipping...`);
        totalSkipped++;
        continue;
      }
      
      const newScreen = new ScreenTbl({
        _id: screen._id,
        name: screen.name || `Screen ${screen.screenNumber}`,
        screenNumber: screen.screenNumber || screen.name?.replace(/\D/g, '') || '1',
        theatre: screen.theatre,
        seatLayout: {
          layout: screen.seatLayout?.layout || [],
          rows: screen.seatLayout?.rows || 0,
          seatsPerRow: screen.seatLayout?.seatsPerRow || 0,
          totalSeats: screen.seatLayout?.totalSeats || 0,
        },
        seatTiers: screen.seatTiers || [],
        isActive: screen.isActive,
        status: screen.isActive ? 'active' : 'inactive',
      });
      
      await newScreen.save();
      console.log(`✅ Migrated old screen: ${screen.name}`);
      totalMigrated++;
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Total screens migrated: ${totalMigrated}`);
    console.log(`⏭️  Total screens skipped: ${totalSkipped}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

migrateOldScreensToScreenTbl();
