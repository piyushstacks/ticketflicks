import mongoose from "mongoose";
import User from "./models/User.js";
import Theatre from "./models/Theatre.js";
import ScreenTbl from "./models/ScreenTbl.js";
import Movie from "./models/Movie.js";
import ShowTbls from "./models/show_tbls.js";
import dotenv from "dotenv";

dotenv.config();

const createTestShow = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-booking');
    console.log("Connected to database");
    
    // Find the test manager
    const user = await User.findOne({ email: "testmanager@example.com" });
    if (!user) {
      console.log("Manager user not found");
      return;
    }
    
    // Find the theatre
    const theatre = await Theatre.findById(user.managedTheatreId);
    if (!theatre) {
      console.log("Theatre not found");
      return;
    }
    
    // Find the screen
    const screen = await ScreenTbl.findOne({ theatre: theatre._id });
    if (!screen) {
      console.log("Screen not found");
      return;
    }
    
    // Find an available movie
    const movie = await Movie.findOne({});
    if (!movie) {
      console.log("No movies found");
      return;
    }
    
    console.log("Found:", theatre.name, screen.name, movie.title);
    
    // Create a test show for tomorrow at 7 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(19, 0, 0, 0);
    
    const existingShow = await Show.findOne({
      theatre: theatre._id,
      screen: screen._id,
      showDateTime: tomorrow
    });
    
    if (existingShow) {
      console.log("Show already exists for this time slot");
    } else {
      const show = new Show({
        movie: movie._id,
        theatre: theatre._id,
        screen: screen._id,
        showDateTime: tomorrow,
        showTime: "19:00",
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week run
        basePrice: 150,
        language: "en",
        seatTiers: [
          {
            tierName: "Regular",
            price: 150,
            seatsPerRow: 10,
            rowCount: 4,
            totalSeats: 40
          },
          {
            tierName: "Premium",
            price: 250,
            seatsPerRow: 10,
            rowCount: 5,
            totalSeats: 50
          }
        ],
        totalCapacity: 90,
        occupiedSeatsCount: 0,
        isActive: true
      });
      
      await show.save();
      console.log("Test show created successfully for:", tomorrow.toDateString());
      console.log("Show ID:", show._id);
    }
    
  } catch (error) {
    console.error("Error creating test show:", error);
  } finally {
    await mongoose.disconnect();
  }
};

createTestShow();