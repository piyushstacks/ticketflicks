import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkUserDetails = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    console.log("User details:");
    console.log("- ID:", user._id);
    console.log("- Name:", user.name);
    console.log("- Email:", user.email);
    console.log("- Role:", user.role);
    console.log("- managedTheatreId:", user.managedTheatreId);
    
    // Try different email variations
    const variations = [
      "testmanager@example.com",
      "testmanager@example.com".toLowerCase(),
      "TESTMANAGER@EXAMPLE.COM"
    ];
    
    for (const email of variations) {
      const found = await User.findOne({ email: email });
      console.log(`Query for "${email}": ${found ? 'Found' : 'Not found'}`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkUserDetails();