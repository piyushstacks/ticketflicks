import mongoose from "mongoose";
import User from "./models/User.js";
import Theatre from "./models/Theatre.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const createManagerUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Check if user already exists
    let user = await User.findOne({ email: "testmanager@example.com" });
    
    if (!user) {
      // Create new user
      const hashedPassword = await bcrypt.hash("Password123!", 10);
      
      user = new User({
        name: "Test Manager",
        email: "testmanager@example.com",
        phone: "1234567890",
        password_hash: hashedPassword,
        role: "manager"
      });
      
      await user.save();
      console.log("Manager user created successfully");
    } else {
      console.log("User already exists, updating role to manager");
      user.role = "manager";
      await user.save();
    }
    
    console.log("User:", user.email, "Role:", user.role);
    
    // Create a theatre for the manager
    const existingTheatre = await Theatre.findOne({ manager_id: user._id });
    
    if (!existingTheatre) {
      const theatre = new Theatre({
        name: "Test Theatre",
        location: "Test Location",
        contact_no: "1234567890",
        email: "testtheatre@example.com",
        manager_id: user._id,
        approval_status: "approved",
        approval_date: new Date()
      });
      
      await theatre.save();
      console.log("Test theatre created for manager");
      
      // Update user with managedTheatreId
      user.managedTheatreId = theatre._id;
      await user.save();
      console.log("User updated with managedTheatreId");
    } else {
      console.log("Theatre already exists for this manager");
    }
    
  } catch (error) {
    console.error("Error creating manager user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createManagerUser();