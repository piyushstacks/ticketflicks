import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import ScreenTbl from '../models/ScreenTbl.js';
import User from '../models/User.js';

const migrateScreensToScreenTbl = async () => {
  try {
    console.log('🔄 Starting screen migration to SCREEN_TBL...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieticketbooking', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get all theatres with screens
    const theatres = await Theatre.find({ 
      screens: { $exists: true, $ne: [] } 
    });
    
    console.log(`📊 Found ${theatres.length} theatres with screens`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    
    for (const theatre of theatres) {
      console.log(`\n🏢 Processing theatre: ${theatre.name} (${theatre._id})`);
      console.log(`📺 Current screens: ${theatre.screens.length}`);
      
      for (const screen of theatre.screens) {
        try {
          // Check if screen already exists in SCREEN_TBL
          const existingScreen = await ScreenTbl.findOne({
            name: screen.name,
            theatre: theatre._id
          });
          
          if (existingScreen) {
            console.log(`⏭️  Screen "${screen.name}" already exists, skipping...`);
            totalSkipped++;
            continue;
          }
          
          // Get manager for this theatre
          const manager = await User.findOne({ 
            _id: theatre.manager_id,
            role: 'manager'
          });
          
          // Create new screen in SCREEN_TBL
          const newScreen = new ScreenTbl({
            name: screen.name,
            screenNumber: screen.name.replace(/\D/g, '') || '1', // Extract number from name
            theatre: theatre._id,
            seatLayout: {
              layout: screen.layout.layout || [],
              rows: screen.layout.rows || 0,
              seatsPerRow: screen.layout.seatsPerRow || 0,
              totalSeats: screen.layout.totalSeats || 0,
            },
            seatTiers: screen.pricing.seatTiers || [],
            isActive: screen.status === 'active',
            status: screen.status || 'active',
            createdBy: manager?._id,
            lastModifiedBy: manager?._id,
          });
          
          await newScreen.save();
          console.log(`✅ Migrated screen: ${screen.name}`);
          totalMigrated++;
          
        } catch (screenError) {
          console.error(`❌ Error migrating screen "${screen.name}":`, screenError.message);
        }
      }
      
      // Optionally, you can clear the old screens array after successful migration
      // theatre.screens = [];
      // await theatre.save();
      // console.log(`🗑️  Cleared old screens array for theatre: ${theatre.name}`);
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`✅ Total screens migrated: ${totalMigrated}`);
    console.log(`⏭️  Total screens skipped: ${totalSkipped}`);
    console.log(`📊 Total screens processed: ${totalMigrated + totalSkipped}`);
    
    // Verify migration
    const totalScreensInTbl = await ScreenTbl.countDocuments();
    console.log(`📈 Total screens in SCREEN_TBL: ${totalScreensInTbl}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateScreensToScreenTbl();
}

export default migrateScreensToScreenTbl;