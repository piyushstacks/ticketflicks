import express from "express";
import { getMovieReviews, getReviewReplies, postReview, toggleLikeReview, getTwitterReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get Twitter reviews for a movie (public)
router.get("/twitter/:movieId", getTwitterReviews);

// Get top-level reviews for a movie
router.get("/:movieId", getMovieReviews);

// Get replies for a specific review
router.get("/replies/:reviewId", getReviewReplies);

// Post a review or reply
router.post("/:movieId", protect, postReview);

// Toggle like
router.post("/:reviewId/like", protect, toggleLikeReview);

export default router;
