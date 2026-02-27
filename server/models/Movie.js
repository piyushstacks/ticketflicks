import mongoose from "mongoose";

const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  genre_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Genre", 
    required: true 
  }],
  language_id: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Language", 
    required: true 
  }],
  duration_min: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  release_date: { 
    type: Date, 
    required: true 
  },
  description: { 
    type: String, 
    required: true, 
    trim: true 
  },
  poster_path: { 
    type: String, 
    trim: true 
  },
  backdrop_path: { 
    type: String, 
    trim: true 
  },
  trailer_link: { 
    type: String, 
    trim: true 
  },
  cast: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Cast", 
    required: true 
  }],
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Index for faster queries
movieSchema.index({ title: 1 });
movieSchema.index({ release_date: 1 });

const Movie = mongoose.model("Movie", movieSchema, "movies_new");

export default Movie;
