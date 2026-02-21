import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkManager = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    console.log("User found:");
    console.log("ID:", user._id.toString());
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Managed Theatre ID:", user.managedTheatreId);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkManager();