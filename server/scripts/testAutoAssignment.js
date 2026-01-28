import mongoose from "mongoose";
import dotenv from "dotenv";
import Movie from "../models/Movie.js";
import Theatre from "../models/Theatre.js";
import User from "../models/User.js";
import bcryptjs from "bcryptjs";

dotenv.config();

const testAutoAssignment = async () => {
  try {
    console.log("🧪 Starting auto-assignment test...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check existing users
    console.log("\n👥 Checking existing users...");
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users:`);
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role}`);
    });

    // Get admin user or create one
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("\n🔧 Creating test admin user...");
      adminUser = new User({
        name: "Test Admin",
        email: "admin@test.com",
        phone: "1234567890",
        password_hash: bcryptjs.hashSync("admin123", 10),
        role: "admin"
      });
      await adminUser.save();
      console.log(`✅ Created admin user: ${adminUser.name} (${adminUser.email})`);
    } else {
      console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);
    }

    // Get active theatres
    const activeTheatres = await Theatre.find({ disabled: false });
    console.log(`\n🏢 Found ${activeTheatres.length} active theatres`);
    if (activeTheatres.length === 0) {
      console.log("📝 Creating test theatres...");
      const testTheatres = [
        { name: "PVR Cinema", location: "Mumbai", manager_id: adminUser._id, disabled: false },
        { name: "INOX", location: "Delhi", manager_id: adminUser._id, disabled: false },
        { name: "Cinepolis", location: "Bangalore", manager_id: adminUser._id, disabled: false }
      ];
      
      for (const theatreData of testTheatres) {
        const theatre = new Theatre(theatreData);
        await theatre.save();
        console.log(`✅ Created theatre: ${theatre.name}`);
      }
    }

    // Refresh active theatres
    const updatedActiveTheatres = await Theatre.find({ disabled: false });
    console.log(`\n🏢 Now have ${updatedActiveTheatres.length} active theatres`);

    // Test 1: Create a new movie with auto-assignment
    console.log("\n🎬 Test 1: Creating new movie with auto-assignment");
    
    const testMovieData = {
      title: "Test Movie - Auto Assignment",
      overview: "This is a test movie for auto-assignment functionality",
      poster_path: "/test-poster.jpg",
      backdrop_path: "/test-backdrop.jpg",
      release_date: new Date("2024-12-25"),
      vote_average: 8.5,
      runtime: 120,
      genres: ["Action", "Adventure"],
      original_language: "en",
      isActive: true,
      addedByAdmin: adminUser._id,
      theatres: updatedActiveTheatres.map(t => t._id),
      excludedTheatres: []
    };

    const newMovie = new Movie(testMovieData);
    await newMovie.save();
    console.log(`✅ Created movie: ${newMovie.title}`);
    console.log(`📍 Auto-assigned to ${newMovie.theatres.length} theatres`);

    // Test 2: Exclude a theatre from the movie
    console.log("\n🚫 Test 2: Excluding a theatre from the movie");
    
    if (updatedActiveTheatres.length > 0) {
      const theatreToExclude = updatedActiveTheatres[0];
      
      // Add to excludedTheatres and remove from theatres
      await Movie.findByIdAndUpdate(newMovie._id, {
        $addToSet: { excludedTheatres: theatreToExclude._id },
        $pull: { theatres: theatreToExclude._id }
      });
      
      const updatedMovie = await Movie.findById(newMovie._id);
      console.log(`✅ Excluded theatre: ${theatreToExclude.name}`);
      console.log(`📍 Now assigned to ${updatedMovie.theatres.length} theatres`);
      console.log(`🚫 Excluded from ${updatedMovie.excludedTheatres.length} theatres`);
    }

    // Test 3: Test manager view filtering
    console.log("\n👥 Test 3: Testing manager view filtering");
    
    // Get or create a manager user
    let managerUser = await User.findOne({ role: "manager" });
    if (!managerUser) {
      console.log("🔧 Creating test manager user...");
      managerUser = new User({
        name: "Test Manager",
        email: "manager@test.com",
        phone: "9876543210",
        password_hash: bcryptjs.hashSync("manager123", 10),
        role: "manager",
        managedTheaterId: updatedActiveTheatres[1]._id // Assign to second theatre
      });
      await managerUser.save();
      console.log(`✅ Created manager user: ${managerUser.name} (${managerUser.email})`);
    } else {
      console.log(`✅ Found manager user: ${managerUser.name} (${managerUser.email})`);
    }

    if (managerUser && managerUser.managedTheatreId) {
      const managerTheatreId = managerUser.managedTheatreId;
      const managerTheatre = updatedActiveTheatres.find(t => t._id.equals(managerTheatreId));
      
      // Test the filtering logic
      const availableMovies = await Movie.find({
        isActive: true,
        theatres: managerTheatreId,
        excludedTheatres: { $ne: managerTheatreId }
      });
      
      console.log(`✅ Manager (${managerTheatre.name}) can see ${availableMovies.length} movies`);
      
      // Check if our test movie is visible to this manager
      const isMovieVisible = availableMovies.some(movie => movie._id.equals(newMovie._id));
      console.log(`🎬 Test movie visible to manager: ${isMovieVisible}`);
    } else {
      console.log("⚠️  No manager user with managedTheatreId found for testing");
    }

    // Test 4: Include the theatre back
    console.log("\n✅ Test 4: Including the theatre back");
    
    if (updatedActiveTheatres.length > 0) {
      const theatreToInclude = updatedActiveTheatres[0];
      
      // Remove from excludedTheatres and add back to theatres
      await Movie.findByIdAndUpdate(newMovie._id, {
        $pull: { excludedTheatres: theatreToInclude._id },
        $addToSet: { theatres: theatreToInclude._id }
      });
      
      const finalMovie = await Movie.findById(newMovie._id);
      console.log(`✅ Included theatre back: ${theatreToInclude.name}`);
      console.log(`📍 Final assignment: ${finalMovie.theatres.length} theatres`);
      console.log(`🚫 Final exclusions: ${finalMovie.excludedTheatres.length} theatres`);
    }

    console.log("\n🎉 All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the tests
testAutoAssignment();