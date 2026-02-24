import mongoose from "mongoose";
import dotenv from "dotenv";

// Old Movie Model
import OldMovie from "../models/Movie.js";

// New Models
import NewMovie from "../models/Movie_new.js";
import NewGenre from "../models/Genre.js";
import NewLanguage from "../models/Language.js";
import NewCast from "../models/Cast.js";

dotenv.config();

const log = (msg) => console.log(`[MOVIE-MIGRATE] ${msg}`);
const error = (msg, err) => console.error(`[MOVIE-MIGRATE ERROR] ${msg}`, err);

// Default data for empty fields
const DEFAULT_GENRES = [
  { name: "Action", description: "Action movies with exciting sequences" },
  { name: "Drama", description: "Dramatic storytelling" },
  { name: "Comedy", description: "Comedic entertainment" },
  { name: "Thriller", description: "Thrilling suspense movies" },
  { name: "Romance", description: "Romantic stories" },
  { name: "Horror", description: "Horror and scary movies" },
  { name: "Sci-Fi", description: "Science fiction" },
  { name: "Adventure", description: "Adventure films" },
];

const DEFAULT_LANGUAGES = [
  { name: "English", code: "en", region: "United States" },
  { name: "Hindi", code: "hi", region: "India" },
  { name: "Tamil", code: "ta", region: "India" },
  { name: "Telugu", code: "te", region: "India" },
  { name: "Malayalam", code: "ml", region: "India" },
  { name: "Kannada", code: "kn", region: "India" },
  { name: "Marathi", code: "mr", region: "India" },
];

const DEFAULT_CAST = [
  { name: "Unknown Actor", bio: "Cast information not available" },
];

// Create default metadata if not exists
const ensureDefaultMetadata = async () => {
  log("Ensuring default metadata exists...");

  // Create default genres
  for (const genre of DEFAULT_GENRES) {
    const exists = await NewGenre.findOne({ name: genre.name });
    if (!exists) {
      await NewGenre.create(genre);
      log(`Created genre: ${genre.name}`);
    }
  }

  // Create default languages
  for (const lang of DEFAULT_LANGUAGES) {
    const exists = await NewLanguage.findOne({ code: lang.code });
    if (!exists) {
      await NewLanguage.create(lang);
      log(`Created language: ${lang.name}`);
    }
  }

  // Create default cast
  for (const cast of DEFAULT_CAST) {
    const exists = await NewCast.findOne({ name: cast.name });
    if (!exists) {
      await NewCast.create(cast);
      log(`Created cast: ${cast.name}`);
    }
  }

  log("Default metadata ready");
};

// Get or create genre
const getOrCreateGenre = async (genreName) => {
  if (!genreName) return null;
  
  let genre = await NewGenre.findOne({ name: genreName });
  if (!genre) {
    try {
      genre = await NewGenre.create({
        name: genreName,
        description: `Genre: ${genreName}`,
      });
      log(`Created new genre: ${genreName}`);
    } catch (err) {
      // Duplicate key, fetch again
      genre = await NewGenre.findOne({ name: genreName });
    }
  }
  return genre;
};

// Get or create language
const getOrCreateLanguage = async (langCode) => {
  if (!langCode) return null;
  
  let lang = await NewLanguage.findOne({ code: langCode });
  if (!lang) {
    try {
      lang = await NewLanguage.create({
        name: langCode.toUpperCase(),
        code: langCode,
        region: "Unknown",
      });
      log(`Created new language: ${langCode}`);
    } catch (err) {
      lang = await NewLanguage.findOne({ code: langCode });
    }
  }
  return lang;
};

// Get or create cast
const getOrCreateCast = async (castName) => {
  if (!castName) return null;
  
  let cast = await NewCast.findOne({ name: castName });
  if (!cast) {
    try {
      cast = await NewCast.create({
        name: castName,
        bio: `Actor: ${castName}`,
      });
    } catch (err) {
      cast = await NewCast.findOne({ name: castName });
    }
  }
  return cast;
};

// Migrate movies
const migrateMovies = async () => {
  log("Starting Movie migration...");

  // Clear existing movies in new collection
  await NewMovie.deleteMany({});
  log("Cleared existing movies from new collection");

  // Ensure default metadata exists
  await ensureDefaultMetadata();

  // Get default IDs for empty fields
  const defaultGenre = await NewGenre.findOne({ name: "Action" });
  const defaultLanguage = await NewLanguage.findOne({ code: "en" });
  const defaultCast = await NewCast.findOne({ name: "Unknown Actor" });

  const oldMovies = await OldMovie.find();
  log(`Found ${oldMovies.length} movies in old collection`);

  let successCount = 0;
  let errorCount = 0;

  for (const oldMovie of oldMovies) {
    try {
      // Check if movie with same title already exists
      const existing = await NewMovie.findOne({ title: oldMovie.title });
      if (existing) {
        log(`⚠️ Skipping duplicate: ${oldMovie.title}`);
        continue;
      }
      // Map genres
      const genre_ids = [];
      if (oldMovie.genres && Array.isArray(oldMovie.genres) && oldMovie.genres.length > 0) {
        for (const genre of oldMovie.genres) {
          const genreName = typeof genre === "string" ? genre : genre.name;
          const genreDoc = await getOrCreateGenre(genreName);
          if (genreDoc && !genre_ids.includes(genreDoc._id.toString())) {
            genre_ids.push(genreDoc._id.toString());
          }
        }
      }
      // Use default if no genres
      if (genre_ids.length === 0 && defaultGenre) {
        genre_ids.push(defaultGenre._id.toString());
      }

      // Map languages
      const language_id = [];
      if (oldMovie.original_language) {
        const langDoc = await getOrCreateLanguage(oldMovie.original_language);
        if (langDoc) {
          language_id.push(langDoc._id.toString());
        }
      }
      // Use default if no language
      if (language_id.length === 0 && defaultLanguage) {
        language_id.push(defaultLanguage._id.toString());
      }

      // Map cast
      const cast = [];
      if (oldMovie.casts && Array.isArray(oldMovie.casts) && oldMovie.casts.length > 0) {
        for (const castMember of oldMovie.casts) {
          const castName = typeof castMember === "string" ? castMember : castMember.name;
          const castDoc = await getOrCreateCast(castName);
          if (castDoc && !cast.includes(castDoc._id.toString())) {
            cast.push(castDoc._id.toString());
          }
        }
      }
      // Use default if no cast
      if (cast.length === 0 && defaultCast) {
        cast.push(defaultCast._id.toString());
      }

      // Create new movie with defaults for empty fields
      await NewMovie.create({
        title: oldMovie.title || "Untitled Movie",
        genre_ids,
        language_id,
        duration_min: oldMovie.runtime || 120, // Default 2 hours
        release_date: oldMovie.release_date || new Date("2024-01-01"), // Default date
        description: oldMovie.overview || `Watch ${oldMovie.title || "this movie"} at TicketFlicks. An exciting cinematic experience awaits you.`,
        poster_path: oldMovie.poster_path || "",
        backdrop_path: oldMovie.backdrop_path || "",
        trailer_link: oldMovie.trailer_path || "",
        cast,
        isDeleted: oldMovie.isActive === false,
      });

      successCount++;
      log(`✅ Migrated: ${oldMovie.title}`);
    } catch (err) {
      errorCount++;
      error(`Failed to migrate: ${oldMovie.title}`, err.message);
    }
  }

  log(`\n🎉 Movie Migration Complete!`);
  log(`✅ Success: ${successCount}`);
  log(`❌ Errors: ${errorCount}`);
  log(`📊 Total processed: ${successCount + errorCount}`);
};

// Main function
const runMigration = async () => {
  try {
    log("🚀 Starting Movie-only migration...");
    log(`Connecting to: ${process.env.MONGODB_URI}`);

    await mongoose.connect(process.env.MONGODB_URI);
    log("✅ Connected to MongoDB");

    await migrateMovies();

    log("\n✅ Migration completed successfully!");
  } catch (err) {
    error("Migration failed", err);
    process.exit(1);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await mongoose.disconnect();
    log("Disconnected from MongoDB");
    process.exit(0);
  }
};

runMigration();
