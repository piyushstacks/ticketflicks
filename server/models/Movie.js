import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    overview: { type: String },
    poster_path: { type: String },
    backdrop_path: { type: String },
    trailer_path: { type: String },
    release_date: { type: Date },
    original_language: { type: String, default: "en" },
    tagline: { type: String },
    genres: { type: Array, default: [] },
    casts: { type: Array, default: [] },
    vote_average: { type: Number, default: 0 },
    runtime: { type: Number }, // in minutes
    tmdbId: { type: Number, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
    addedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    theatres: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Theatre",
      default: [],
    }, // Theatres showing this movie
    excludedTheatres: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Theatre",
      default: [],
    }, // Theatres excluded from showing this movie
    reviews: {
      type: [String], // Array of Twitter/X post URLs
      default: [],
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const Movie = mongoose.model("Movie", movieSchema, "movie_tbls");

export default Movie;
