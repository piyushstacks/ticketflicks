import mongoose from "mongoose";

const ratingsReviewSchema = new mongoose.Schema({
  movie_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Movie", 
    required: true 
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 5 
  },
  review: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

// Index for faster queries
ratingsReviewSchema.index({ movie_id: 1 });
ratingsReviewSchema.index({ user_id: 1 });

const RatingsReview = mongoose.model("RatingsReview", ratingsReviewSchema, "ratings_reviews");

export default RatingsReview;
