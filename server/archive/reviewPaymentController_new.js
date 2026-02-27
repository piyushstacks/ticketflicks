import RatingsReview from "../models/RatingsReview.js";
import Payment from "../models/Payment.js";

// ============== RATINGS & REVIEWS CONTROLLERS ==============

export const createReview = async (req, res) => {
  try {
    const { movie_id, user_id, rating, review } = req.body;

    if (!movie_id || !user_id || rating === undefined) {
      return res.json({
        success: false,
        message: "Please provide movie_id, user_id, and rating",
      });
    }

    if (rating < 0 || rating > 5) {
      return res.json({
        success: false,
        message: "Rating must be between 0 and 5",
      });
    }

    const ratingsReview = await RatingsReview.create({
      movie_id,
      user_id,
      rating,
      review,
    });

    await ratingsReview.populate("movie_id user_id", "name title");

    res.json({
      success: true,
      message: "Review created successfully",
      ratingsReview,
    });
  } catch (error) {
    console.error("[createReview]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getReviewsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;

    const reviews = await RatingsReview.find({ movie_id: movieId })
      .populate("user_id", "name")
      .populate("movie_id", "title")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      success: true,
      reviews,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("[getReviewsByMovie]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await RatingsReview.find({ user_id: userId })
      .populate("movie_id", "title poster_path")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("[getReviewsByUser]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;

    const ratingsReview = await RatingsReview.findById(reviewId);
    if (!ratingsReview) {
      return res.json({ success: false, message: "Review not found" });
    }

    if (rating !== undefined) {
      if (rating < 0 || rating > 5) {
        return res.json({
          success: false,
          message: "Rating must be between 0 and 5",
        });
      }
      ratingsReview.rating = rating;
    }
    if (review) ratingsReview.review = review;

    await ratingsReview.save();

    res.json({
      success: true,
      message: "Review updated successfully",
      ratingsReview,
    });
  } catch (error) {
    console.error("[updateReview]", error);
    res.json({ success: false, message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await RatingsReview.findByIdAndDelete(reviewId);
    if (!review) {
      return res.json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("[deleteReview]", error);
    res.json({ success: false, message: error.message });
  }
};

// ============== PAYMENT CONTROLLERS ==============

export const createPayment = async (req, res) => {
  try {
    const { booking_id, amount, method, transaction_id } = req.body;

    if (!booking_id || !amount || !method || !transaction_id) {
      return res.json({
        success: false,
        message: "Please provide booking_id, amount, method, and transaction_id",
      });
    }

    const payment = await Payment.create({
      booking_id,
      amount,
      method,
      transaction_id,
      status: "success",
      payment_time: new Date(),
    });

    await payment.populate("booking_id");

    res.json({
      success: true,
      message: "Payment recorded successfully",
      payment,
    });
  } catch (error) {
    console.error("[createPayment]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await Payment.findOne({ booking_id: bookingId })
      .populate("booking_id");

    if (!payment) {
      return res.json({
        success: false,
        message: "Payment not found for this booking",
      });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("[getPaymentByBooking]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getPaymentByTransactionId = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findOne({ transaction_id: transactionId })
      .populate("booking_id");

    if (!payment) {
      return res.json({ success: false, message: "Payment not found" });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("[getPaymentByTransactionId]", error);
    res.json({ success: false, message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!["success", "failed", "refunded", "pending"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );

    if (!payment) {
      return res.json({ success: false, message: "Payment not found" });
    }

    res.json({
      success: true,
      message: "Payment status updated",
      payment,
    });
  } catch (error) {
    console.error("[updatePaymentStatus]", error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate("booking_id")
      .sort({ payment_time: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    console.error("[getAllPayments]", error);
    res.json({ success: false, message: error.message });
  }
};

export default {
  createReview,
  getReviewsByMovie,
  getReviewsByUser,
  updateReview,
  deleteReview,
  createPayment,
  getPaymentByBooking,
  getPaymentByTransactionId,
  updatePaymentStatus,
  getAllPayments,
};
