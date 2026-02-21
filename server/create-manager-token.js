import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const createManagerToken = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    // Create a token manually
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    console.log("Generated token:", token);
    console.log("User ID:", user._id.toString());
    console.log("Role:", user.role);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createManagerToken();