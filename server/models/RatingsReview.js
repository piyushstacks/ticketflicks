import mongoose from "mongoose";

const ratingsReviewSchema = new mongoose.Schema({
  movie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
  },
  // Type of review: 'twitter' for fetched Twitter reviews
  type: {
    type: String,
    enum: ["twitter", "user"],
    default: "twitter"
  },
  // Twitter-specific fields
  tweet_url: {
    type: String,
    trim: true,
    default: null
  },
  tweet_id: {
    type: String,
    trim: true,
    default: null
  },
  author_handle: {
    type: String,
    trim: true,
    default: null
  },
  author_name: {
    type: String,
    trim: true,
    default: null
  },
  author_profile_image: {
    type: String,
    trim: true,
    default: null
  },
  tweet_content: {
    type: String,
    trim: true,
    default: null
  },
  tweet_likes: {
    type: Number,
    default: 0
  },
  tweet_retweets: {
    type: Number,
    default: 0
  },
  tweet_replies: {
    type: Number,
    default: 0
  },
  tweet_views: {
    type: Number,
    default: 0
  },
  tweet_date: {
    type: Date,
    default: null
  },
  // For user reviews (optional, kept for backward compatibility)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,   // supports TMDB/IMDB scale (0–10)
    default: null
  },
  // Admin-added Twitter/X review URLs (from movie form)
  reviews: {
    type: [String],
    default: []
  },
  review: {
    type: String,
    trim: true,
    default: null
  },
  parent_review_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RatingsReview",
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
ratingsReviewSchema.index({ movie_id: 1 });
ratingsReviewSchema.index({ type: 1 });
ratingsReviewSchema.index({ author_handle: 1 });

const RatingsReview = mongoose.model("RatingsReview", ratingsReviewSchema, "ratings_reviews");

export default RatingsReview;
