import mongoose from "mongoose";
import User from "./models/User.js";
import Theatre from "./models/Theatre.js";
import ScreenTbl from "./models/ScreenTbl.js";
import dotenv from "dotenv";

dotenv.config();

const createTestScreen = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    console.log("Found manager:", user.name, "Theatre ID:", user.managedTheatreId);
    
    // Find the theatre
    const theatre = await Theatre.findById(user.managedTheatreId);
    if (!theatre) {
      console.log("Theatre not found");
      return;
    }
    
    console.log("Found theatre:", theatre.name);
    
    // Create a test screen
    const existingScreen = await ScreenTbl.findOne({ 
      theatre: theatre._id, 
      screenNumber: "1" 
    });
    
    if (existingScreen) {
      console.log("Screen already exists:", existingScreen.name);
    } else {
      const screen = new ScreenTbl({
        name: "Screen 1",
        screenNumber: "1",
        theatre: theatre._id,
        seatLayout: {
          layout: [
            ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
            ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
            ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
            ["R", "R", "R", "R", "R", "R", "R", "R", "R", "R"],
            ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
            ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
            ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
            ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
            ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"]
          ],
          rows: 9,
          seatsPerRow: 10,
          totalSeats: 90
        },
        seatTiers: [
          {
            tierName: "Regular",
            price: 150,
            rows: ["A", "B", "C", "D"]
          },
          {
            tierName: "Premium",
            price: 250,
            rows: ["E", "F", "G", "H", "I"]
          }
        ],
        isActive: true,
        status: 'active',
        createdBy: user._id,
        lastModifiedBy: user._id
      });
      
      await screen.save();
      console.log("Test screen created successfully:", screen.name);
    }
    
  } catch (error) {
    console.error("Error creating test screen:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestScreen();