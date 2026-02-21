import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const promoteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");
    
    // Find the test user
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("User not found");
      return;
    }
    
    console.log("Found user:", user.email, "Current role:", user.role);
    
    // Update role to manager
    user.role = "manager";
    await user.save();
    
    console.log("User promoted to manager successfully");
    
    // Create a theatre for the manager
    const Theatre = mongoose.model("Theatre");
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
    }
    
  } catch (error) {
    console.error("Error promoting user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

promoteUser();