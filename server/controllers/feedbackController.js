import Feedback from "../models/Feedback.js";
import { asyncHandler, AppError } from "../services/errorService.js";

export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, message, userId } = req.body;

  if (!rating) {
    throw new AppError(
      "Please select a rating before submitting your feedback.",
      400
    );
  }

  if (rating < 1 || rating > 5) {
    throw new AppError("Rating must be between 1 and 5 stars.", 400);
  }

  await Feedback.create({ rating, message, user: userId });

  res.json({
    success: true,
    message: "Thank you! Your feedback has been submitted successfully.",
  });
});

export const fetchAllFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({})
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, feedbacks });
});

export default {
  submitFeedback,
  fetchAllFeedbacks,
};
