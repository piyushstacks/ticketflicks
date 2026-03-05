import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = `${process.env.MONGODB_URI.replace(/\/$/, "")}/${process.env.DB_NAME}`;
console.log("Connecting to:", uri);

mongoose.connect(uri)
  .then(() => {
     console.log("Connected to DB:", mongoose.connection.db.databaseName);
     mongoose.connection.db.listCollections().toArray().then(cols => {
        cols.forEach(async (c) => {
           const count = await mongoose.connection.db.collection(c.name).countDocuments();
           if (count > 0 && ['bookings_new', 'movies_new', 'theatres', 'users_new'].includes(c.name)) {
             console.log(`${c.name}: ${count}`);
           }
        });
        setTimeout(() => process.exit(0), 1000);
     });
  });
