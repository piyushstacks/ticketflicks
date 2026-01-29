import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const checkCollections = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieticketbooking';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Collections:', collectionNames);

    if (collectionNames.includes('screens')) {
      const screensCount = await mongoose.connection.db.collection('screens').countDocuments();
      console.log('Screens count:', screensCount);
    } else {
      console.log('Screens collection not found');
    }

    if (collectionNames.includes('screen_tbl')) {
      const screenTblCount = await mongoose.connection.db.collection('screen_tbl').countDocuments();
      console.log('ScreenTbl count:', screenTblCount);
    } else {
      console.log('ScreenTbl collection not found');
    }

    const theatres = await mongoose.connection.db.collection('theatres').find({}).toArray();
    const embeddedScreens = theatres.reduce((acc, t) => acc + (t.screens ? t.screens.length : 0), 0);
    console.log('Embedded screens count:', embeddedScreens);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkCollections();
