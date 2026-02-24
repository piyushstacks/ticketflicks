import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
  try {
    console.log("Connecting...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected! State:", mongoose.connection.readyState);
    
    // Test with native driver
    const nativeCount = await mongoose.connection.db.collection('movies_new').countDocuments();
    console.log("Native driver count:", nativeCount);
    
    // Import model AFTER connection
    const { default: Movie } = await import("../models/Movie_new.js");
    console.log("Model loaded:", Movie.modelName);
    console.log("Model collection:", Movie.collection.collectionName);
    
    // Test with model
    const modelCount = await Movie.countDocuments();
    console.log("Model count:", modelCount);
    
    await mongoose.disconnect();
    console.log("Done");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

testConnection();
