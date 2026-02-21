import mongoose from "mongoose";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const checkManagerPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    console.log("Found manager:", user.email);
    console.log("Has password hash:", !!user.password_hash);
    console.log("Password hash length:", user.password_hash?.length);
    
    // Test the password
    const testPassword = "password123";
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log("Password 'password123' matches:", isMatch);
    
    // If it doesn't match, let's update it
    if (!isMatch) {
      console.log("Updating password to 'password123'");
      user.password_hash = await bcrypt.hash(testPassword, 10);
      await user.save();
      console.log("Password updated successfully");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkManagerPassword();