import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, "Title is required"],
    unique: true, 
    trim: true,
    minlength: [1, "Title cannot be empty"]
  },
  genre_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Genre"
  }],
  language_id: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Language"
  }],
  duration_min: { 
    type: Number, 
    required: [true, "Duration is required"],
    min: [1, "Duration must be at least 1 minute"]
  },
  release_date: { 
    type: Date, 
    required: [true, "Release date is required"]
  },
  description: { 
    type: String, 
    required: [true, "Description is required"],
    trim: true,
    minlength: [10, "Description must be at least 10 characters"]
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
  trailer_link: { 
    type: String, 
    trim: true,
    default: null
  },
  cast: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Cast"
  }],
  // Rating information
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
    default: true,
    select: false
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
movieSchema.index({ title: 1 });
movieSchema.index({ release_date: 1 });
movieSchema.index({ isDeleted: 1 });
movieSchema.index({ isActive: 1 });

// Query middleware to exclude deleted movies by default
movieSchema.pre(/^find/, function() {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Movie = mongoose.model("Movie", movieSchema, "movies_new");

export default Movie;
