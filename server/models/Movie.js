import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
    trim: true,
    minlength: [1, "Title cannot be empty"]
  },
  // Support both 'overview' and 'description' (overview is primary)
  overview: {
    type: String,
    trim: true,
    default: ""
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  // Genres as array of objects { id, name } (TMDB style) OR ObjectIds
  genres: [{
    id: { type: Number },
    name: { type: String }
  }],
  genre_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Genre"
  }],
  // Language as string (original_language) 
  original_language: {
    type: String,
    trim: true,
    default: "en"
  },
  language_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language"
  }],
  // Duration in minutes - support both runtime and duration_min
  runtime: {
    type: Number,
    default: 120,
    min: [1, "Duration must be at least 1 minute"]
  },
  duration_min: {
    type: Number,
    default: 120,
    min: [1, "Duration must be at least 1 minute"]
  },
  release_date: {
    type: Date,
    required: [true, "Release date is required"]
  },
  // Poster/backdrop - store as full URL
  poster_path: {
    type: String,
    trim: true,
    default: null
  },
  backdrop_path: {
    type: String,
    trim: true,
    default: null
  },
  // Trailer URL - support both trailer_link and trailer_path
  trailer_link: {
    type: String,
    trim: true,
    default: null
  },
  trailer_path: {
    type: String,
    trim: true,
    default: null
  },
  tagline: {
    type: String,
    trim: true,
    default: ""
  },
  // Cast as array of objects { name, profile_path, character }
  casts: [{
    name: { type: String },
    profile_path: { type: String, default: null },
    character: { type: String, default: "" }
  }],
  cast: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cast"
  }],
  // Social media reviews (Twitter/X URLs)
  reviews: [{ type: String }],
  // Rating information
  vote_average: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  imdbRating: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
movieSchema.index({ release_date: 1 });
movieSchema.index({ isDeleted: 1 });
movieSchema.index({ isActive: 1 });

// Query middleware to exclude deleted movies by default
movieSchema.pre(/^find/, function () {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Movie = mongoose.model("Movie", movieSchema, "movies_new");

export default Movie;
