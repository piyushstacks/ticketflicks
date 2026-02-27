import mongoose from "mongoose";
import dotenv from "dotenv";

// Unified Models (all consolidated into single files)
import User from "../models/User.js";
import Theatre from "../models/Theatre.js";
import Movie from "../models/Movie.js";
import Screen from "../models/Screen.js";
import Show from "../models/show_tbls.js";
import Booking from "../models/Booking.js";
import Seat from "../models/Seat.js";
import SeatCategory from "../models/SeatCategory.js";
import Genre from "../models/Genre.js";
import Language from "../models/Language.js";
import Cast from "../models/Cast.js";
import Payment from "../models/Payment.js";

dotenv.config();

console.log("[MIGRATE] Script starting...");
console.log("[MIGRATE] Imports completed");

// ID Mapping for cross-referencing during migration
const idMaps = {
  user: new Map(),
  theater: new Map(),
  movie: new Map(),
  screen: new Map(),
  show: new Map(),
  seatCategory: new Map(),
  seat: new Map(),
};

const log = (msg) => console.log(`[MIGRATE] ${msg}`);
const error = (msg, err) => console.error(`[MIGRATE ERROR] ${msg}`, err);

// ============ MIGRATION FUNCTIONS ============

const migrateUsers = async () => {
  log("Starting User verification...");
  const users = await User.find();
  let count = 0;

  for (const user of users) {
    try {
      // Verify user has required fields
      if (user._id && user.email) {
        idMaps.user.set(user._id.toString(), user._id.toString());
        count++;
      }
    } catch (err) {
      error(`Failed to process user ${user.email}`, err.message);
    }
  }
  log(`✅ Found ${count} users in unified schema`);
};

const migrateTheaters = async () => {
  log("Starting Theater migration...");
  const oldTheatres = await OldTheatre.find();
  let count = 0;

  for (const oldTheatre of oldTheatres) {
    try {
      const managerId = idMaps.user.get(oldTheatre.manager_id?.toString());
      if (!managerId) {
        log(`⚠️ Skipping theater ${oldTheatre.name} - no manager found`);
        continue;
      }

      // Check if theater already exists
      let newTheater = await NewTheater.findOne({ name: oldTheatre.name });
      if (!newTheater) {
        newTheater = await NewTheater.create({
          name: oldTheatre.name,
          location: oldTheatre.address || oldTheatre.location || "Unknown",
          u_id: managerId,
          contact_no: oldTheatre.contact_no || oldTheatre.phone,
          isDeleted: oldTheatre.disabled || false,
        });
        count++;
      }
      idMaps.theater.set(oldTheatre._id.toString(), newTheater._id.toString());
    } catch (err) {
      error(`Failed to migrate theater ${oldTheatre.name}`, err.message);
    }
  }
  log(`✅ Migrated ${count} theaters`);
};

const migrateMetadata = async () => {
  log("Starting Metadata migration (Genres, Languages, Cast)...");
  
  // Extract unique genres from old movies
  const oldMovies = await OldMovie.find();
  const genresMap = new Map();
  const languagesMap = new Map();
  const castMap = new Map();

  for (const movie of oldMovies) {
    // Extract genres
    if (movie.genres && Array.isArray(movie.genres)) {
      for (const genre of movie.genres) {
        const name = typeof genre === "string" ? genre : genre.name;
        if (name && !genresMap.has(name)) {
          try {
            let newGenre = await NewGenre.findOne({ name });
            if (!newGenre) {
              newGenre = await NewGenre.create({
                name,
                description: `Genre: ${name}`,
              });
            }
            genresMap.set(name, newGenre._id.toString());
          } catch (err) {
            if (err.code !== 11000) error(`Failed to create genre ${name}`, err.message);
          }
        }
      }
    }
    
    // Extract languages
    if (movie.original_language) {
      if (!languagesMap.has(movie.original_language)) {
        try {
          let newLang = await NewLanguage.findOne({ code: movie.original_language });
          if (!newLang) {
            newLang = await NewLanguage.create({
              name: movie.original_language.toUpperCase(),
              code: movie.original_language,
              region: "Unknown",
            });
          }
          languagesMap.set(movie.original_language, newLang._id.toString());
        } catch (err) {
          if (err.code !== 11000) error(`Failed to create language`, err.message);
        }
      }
    }

    // Extract cast
    if (movie.casts && Array.isArray(movie.casts)) {
      for (const castMember of movie.casts) {
        const name = typeof castMember === "string" ? castMember : castMember.name;
        if (name && !castMap.has(name)) {
          try {
            let newCast = await NewCast.findOne({ name });
            if (!newCast) {
              newCast = await NewCast.create({
                name,
                bio: typeof castMember === "object" ? `Character: ${castMember.character}` : "",
              });
            }
            castMap.set(name, newCast._id.toString());
          } catch (err) {
            if (err.code !== 11000) error(`Failed to create cast`, err.message);
          }
        }
      }
    }
  }

  log(`✅ Migrated ${genresMap.size} genres, ${languagesMap.size} languages, ${castMap.size} cast members`);
  return { genresMap, languagesMap, castMap };
};

const migrateMovies = async (metadata) => {
  log("Starting Movie migration...");
  const oldMovies = await OldMovie.find();
  let count = 0;

  for (const oldMovie of oldMovies) {
    try {
      // Map genre IDs
      const genre_ids = [];
      if (oldMovie.genres && Array.isArray(oldMovie.genres)) {
        for (const genre of oldMovie.genres) {
          const name = typeof genre === "string" ? genre : genre.name;
          const id = metadata.genresMap.get(name);
          if (id) genre_ids.push(id);
        }
      }

      // Map language IDs
      const language_id = [];
      if (oldMovie.original_language) {
        const id = metadata.languagesMap.get(oldMovie.original_language);
        if (id) language_id.push(id);
      }

      // Map cast IDs
      const cast = [];
      if (oldMovie.casts && Array.isArray(oldMovie.casts)) {
        for (const castMember of oldMovie.casts) {
          const name = typeof castMember === "string" ? castMember : castMember.name;
          const id = metadata.castMap.get(name);
          if (id) cast.push(id);
        }
      }

      // Check if movie already exists
      let newMovie = await NewMovie.findOne({ title: oldMovie.title });
      if (!newMovie) {
        newMovie = await NewMovie.create({
          title: oldMovie.title,
          genre_ids,
          language_id,
          duration_min: oldMovie.runtime || 120,
          release_date: oldMovie.release_date || new Date(),
          description: oldMovie.overview || "No description available",
          poster_path: oldMovie.poster_path,
          backdrop_path: oldMovie.backdrop_path,
          trailer_link: oldMovie.trailer_path,
          cast,
          isDeleted: oldMovie.isActive === false,
        });
        count++;
      }
      idMaps.movie.set(oldMovie._id.toString(), newMovie._id.toString());
    } catch (err) {
      error(`Failed to migrate movie ${oldMovie.title}`, err.message);
    }
  }
  log(`✅ Migrated ${count} movies`);
};

const migrateScreens = async () => {
  log("Starting Screen migration...");
  const oldScreens = await OldScreenTbl.find();
  let count = 0;

  for (const oldScreen of oldScreens) {
    try {
      const theaterId = idMaps.theater.get(oldScreen.theatre?.toString());
      if (!theaterId) {
        log(`⚠️ Skipping screen ${oldScreen.name} - no theater found`);
        continue;
      }

      const newScreen = await NewScreen.create({
        Tid: theaterId,
        name: oldScreen.name || oldScreen.screenNumber || "Unknown Screen",
        capacity: oldScreen.seatLayout?.totalSeats || 200,
        isDeleted: oldScreen.isActive === false,
      });
      idMaps.screen.set(oldScreen._id.toString(), newScreen._id.toString());
      count++;
    } catch (err) {
      error(`Failed to migrate screen`, err.message);
    }
  }
  log(`✅ Migrated ${count} screens`);
};

const migrateSeatCategories = async () => {
  log("Starting Seat Category migration...");
  const oldShows = await OldShowTbls.find();
  const tierMap = new Map();
  let count = 0;

  for (const show of oldShows) {
    if (show.seatTiers && Array.isArray(show.seatTiers)) {
      for (const tier of show.seatTiers) {
        if (tier.tierName && !tierMap.has(tier.tierName)) {
          const newCategory = await NewSeatCategory.create({
            name: tier.tierName,
            price: tier.price || 150,
            description: `${tier.tierName} seating`,
          });
          tierMap.set(tier.tierName, newCategory._id.toString());
          idMaps.seatCategory.set(tier.tierName, newCategory._id.toString());
          count++;
        }
      }
    }
  }
  log(`✅ Migrated ${count} seat categories`);
};

const migrateSeats = async () => {
  log("Starting Seat migration...");
  const oldScreens = await OldScreenTbl.find();
  let count = 0;

  for (const oldScreen of oldScreens) {
    const screenId = idMaps.screen.get(oldScreen._id.toString());
    if (!screenId) continue;

    // Generate seat codes from seat layout
    const seatCodes = [];
    if (oldScreen.seatLayout?.layout) {
      const layout = oldScreen.seatLayout.layout;
      for (let row = 0; row < layout.length; row++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C...
        for (let col = 0; col < layout[row].length; col++) {
          if (layout[row][col] !== null && layout[row][col] !== "") {
            seatCodes.push(`${rowLetter}${col + 1}`);
          }
        }
      }
    }

    // Create seat entries for each tier
    if (oldScreen.seatTiers && Array.isArray(oldScreen.seatTiers)) {
      for (const tier of oldScreen.seatTiers) {
        const categoryId = idMaps.seatCategory.get(tier.tierName);
        if (categoryId) {
          try {
            await NewSeat.create({
              screen_id: screenId,
              category_id: categoryId,
              seat_codes: seatCodes,
            });
            count++;
          } catch (err) {
            error(`Failed to create seats for screen ${screenId}`, err.message);
          }
        }
      }
    }
  }
  log(`✅ Migrated ${count} seat entries`);
};

const migrateShows = async () => {
  log("Starting Show migration...");
  const oldShows = await OldShowTbls.find();
  let count = 0;

  for (const oldShow of oldShows) {
    try {
      const movieId = idMaps.movie.get(oldShow.movie?.toString());
      const theaterId = idMaps.theater.get(oldShow.theatre?.toString());
      const screenId = idMaps.screen.get(oldShow.screen?.toString());

      if (!movieId || !theaterId || !screenId) {
        log(`⚠️ Skipping show - missing refs: movie=${!!movieId}, theater=${!!theaterId}, screen=${!!screenId}`);
        continue;
      }

      // Calculate available seats
      const seats = await NewSeat.find({ screen_id: screenId });
      const available_seats = seats.map(s => s._id.toString());

      const newShow = await NewShow.create({
        movie_id: movieId,
        theater_id: theaterId,
        screen_id: screenId,
        show_date: oldShow.showDateTime || new Date(),
        available_seats,
        isActive: oldShow.isActive !== false,
      });
      idMaps.show.set(oldShow._id.toString(), newShow._id.toString());
      count++;
    } catch (err) {
      error(`Failed to migrate show`, err.message);
    }
  }
  log(`✅ Migrated ${count} shows`);
};

const migrateBookings = async () => {
  log("Starting Booking migration...");
  const oldBookings = await OldBooking.find();
  let count = 0;

  for (const oldBooking of oldBookings) {
    try {
      const userId = idMaps.user.get(oldBooking.user?.toString());
      const showId = idMaps.show.get(oldBooking.show?.toString());

      if (!userId || !showId) {
        log(`⚠️ Skipping booking - missing refs: user=${!!userId}, show=${!!showId}`);
        continue;
      }

      // Map booked seats to new seat structure
      const seats_booked = [];
      if (oldBooking.bookedSeats && Array.isArray(oldBooking.bookedSeats)) {
        // Get seats for the show's screen
        const show = await NewShow.findById(showId);
        if (show) {
          seats_booked.push(...show.available_seats.slice(0, oldBooking.bookedSeats.length));
        }
      }

      const newBooking = await NewBooking.create({
        user_id: userId,
        show_id: showId,
        seats_booked,
        total_amount: oldBooking.amount || 0,
        status: oldBooking.isPaid ? "confirmed" : "pending",
        payment_link: oldBooking.paymentLink,
        isPaid: oldBooking.isPaid || false,
      });

      // Create payment record if paid
      if (oldBooking.isPaid && oldBooking.paymentIntentId) {
        await NewPayment.create({
          booking_id: newBooking._id,
          amount: oldBooking.amount || 0,
          method: "card",
          status: "success",
          transaction_id: oldBooking.paymentIntentId,
          payment_time: new Date(),
        });
      }

      count++;
    } catch (err) {
      error(`Failed to migrate booking`, err.message);
    }
  }
  log(`✅ Migrated ${count} bookings`);
};

// ============ MAIN MIGRATION ============

const runMigration = async () => {
  try {
    log("🚀 Starting database migration...");
    log(`Connecting to: ${process.env.MONGODB_URI}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    log("✅ Connected to MongoDB");

    // Run migrations in order
    await migrateUsers();
    await migrateTheaters();
    const metadata = await migrateMetadata();
    await migrateMovies(metadata);
    await migrateScreens();
    await migrateSeatCategories();
    await migrateSeats();
    await migrateShows();
    await migrateBookings();

    log("\n🎉 Migration completed successfully!");
    log("\nSummary of ID mappings:");
    log(`  Users: ${idMaps.user.size}`);
    log(`  Theaters: ${idMaps.theater.size}`);
    log(`  Movies: ${idMaps.movie.size}`);
    log(`  Screens: ${idMaps.screen.size}`);
    log(`  Shows: ${idMaps.show.size}`);

  } catch (err) {
    error("Migration failed", err);
    process.exit(1);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await mongoose.disconnect();
    log("Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run if executed directly
console.log("[MIGRATE] Checking if should run migration...");
console.log("[MIGRATE] import.meta.url:", import.meta.url);
console.log("[MIGRATE] process.argv[1]:", process.argv[1]);

// Always run migration when script is executed directly
runMigration();

export default runMigration;
