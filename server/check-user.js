import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test user
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (user) {
      console.log("User found:");
      console.log("- ID:", user._id);
      console.log("- Name:", user.name);
      console.log("- Email:", user.email);
      console.log("- Role:", user.role);
      console.log("- managedTheatreId:", user.managedTheatreId);
      console.log("- Created:", user.createdAt);
      console.log("- Updated:", user.updatedAt);
    } else {
      console.log("User not found");
    }
    
  } catch (error) {
    console.error("Error checking user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkUser();