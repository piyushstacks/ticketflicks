import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../configs/db.js";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    await connectDB();
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("Test user already exists");
      process.exit(0);
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash("test123", 10);
    const testUser = new User({
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      password_hash: hashedPassword,
      role: "customer"
    });
    
    await testUser.save();
    console.log("Test user created successfully!");
    console.log("Email: test@example.com");
    console.log("Password: test123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  }
};

createTestUser();