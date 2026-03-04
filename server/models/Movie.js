import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    unique: true,
    trim: true,
    minlength: [1, "Title cannot be empty"]
  },
  // Genre IDs (ObjectId refs for internal genres)
  genre_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Genre"
  }],
  // Genre objects as stored from TMDB { id, name } or string
  genres: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  language_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language"
  }],
  original_language: {
    type: String,
    default: "en"
  },
  // Duration (both field names for compatibility)
  duration_min: {
    type: Number,
    default: 120
  },
  runtime: {
    type: Number,
    default: 120
  },
  release_date: {
    type: Date
  },
  // Description / overview (both kept in sync)
  description: {
    type: String,
    trim: true,
    default: ""
  },
  overview: {
    type: String,
    trim: true,
    default: ""
  },
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
  // Trailer links (both field names for compatibility)
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
  // Cast (ObjectId refs)
  cast: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cast"
  }],
  // Cast as stored from TMDB (array of objects)
  casts: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Rating information
  vote_average: {
    type: Number,
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
  reviews: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  // Who added this movie (admin user reference)
  addedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  // Status — NOT select:false so queries like { isActive: true } work
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
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
