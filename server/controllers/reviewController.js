import RatingsReview from "../models/RatingsReview.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError } from "../services/errorService.js";

/**
 * Get Twitter reviews for a movie
 * Fetches popular Twitter critic reviews stored in database
 */
export const getTwitterReviews = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { limit = 10 } = req.query;

    const reviews = await RatingsReview.find({
        movie_id: movieId,
        type: "twitter",
        isActive: true
    })
        .sort({ tweet_likes: -1, createdAt: -1 })
        .limit(Number(limit));

    const total = await RatingsReview.countDocuments({
        movie_id: movieId,
        type: "twitter",
        isActive: true
    });

    res.json({ success: true, reviews, total });
});

/**
 * Get reviews for a movie
 * Fetch only top-level reviews (parent_review_id: null) and populate child replies
 */
export const getMovieReviews = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { skip = 0, limit = 20 } = req.query;

    // Get top-level reviews
    const reviews = await RatingsReview.find({
        movie_id: movieId,
        parent_review_id: null
    })
        .populate("user_id", "name email")
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit));

    const total = await RatingsReview.countDocuments({
        movie_id: movieId,
        parent_review_id: null
    });

    res.json({ success: true, reviews, total });
});

/**
 * Get replies for a specific review
 */
export const getReviewReplies = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    const replies = await RatingsReview.find({ parent_review_id: reviewId })
        .populate("user_id", "name email")
        .sort({ createdAt: 1 });

    res.json({ success: true, replies });
});

/**
 * Post a new review or reply
 */
export const postReview = asyncHandler(async (req, res) => {
    const { movieId } = req.params;
    const { review, rating, parent_review_id } = req.body;
    const userId = req.user.id;

    if (!review) {
        return res.status(400).json({ success: false, message: "Review text is required" });
    }

    const newReviewArgs = {
        movie_id: movieId,
        user_id: userId,
        review
    };

    if (parent_review_id) {
        newReviewArgs.parent_review_id = parent_review_id;
    } else if (rating !== undefined) {
        newReviewArgs.rating = rating;
    }

    const newReview = await RatingsReview.create(newReviewArgs);

    if (parent_review_id) {
        // Increment reply count of parent
        await RatingsReview.findByIdAndUpdate(parent_review_id, {
            $inc: { replyCount: 1 }
        });
    }

    await newReview.populate("user_id", "name email");

    res.status(201).json({ success: true, review: newReview, message: "Posted successfully" });
});

/**
 * Like / Unlike a review
 */
export const toggleLikeReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await RatingsReview.findById(reviewId);
    if (!review) throw new NotFoundError("Review");

    const alreadyLikedIndex = review.likes.findIndex(id => id.toString() === userId.toString());

    if (alreadyLikedIndex !== -1) {
        review.likes.splice(alreadyLikedIndex, 1);
    } else {
        review.likes.push(userId);
    }

    await review.save();

    res.json({
        success: true,
        message: alreadyLikedIndex !== -1 ? "Review unliked" : "Review liked",
        likesCount: review.likes.length,
        isLiked: alreadyLikedIndex === -1
    });
});
