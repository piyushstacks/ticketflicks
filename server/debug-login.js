import mongoose from "mongoose";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    console.log("Found user:", user.email);
    console.log("Has password hash:", !!user.password_hash);
    
    // Test the password
    const testPassword = "password123";
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log("Password comparison result:", isMatch);
    
    // Let's also check the raw password hash
    console.log("Password hash:", user.password_hash);
    
    // Test with a new hash
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log("New hash:", newHash);
    const isNewMatch = await bcrypt.compare(testPassword, newHash);
    console.log("New hash comparison:", isNewMatch);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

debugLogin();