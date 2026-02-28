import Feedback from "../models/Feedback.js"; // Assuming Mongoose model

export const submitFeedback = async (req, res) => {
  try {
    const { rating, message, userId } = req.body;

    if (!rating) {
      return res.status(400).json({ 
        success: false, 
        message: "Please select a rating before submitting your feedback." 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Rating must be between 1 and 5 stars." 
      });
    }

    await Feedback.create({ rating, message, user: userId });

    res.json({ success: true, message: "Thank you! Your feedback has been submitted successfully." });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    
    // Handle specific error cases
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback data. Please check your input and try again."
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to submit your feedback right now. Please try again in a few minutes." 
    });
  }
};

export const fetchAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error("Error Getting feedback:", error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(500).json({
        success: false,
        message: "Unable to load feedback data. Please try again."
      });
    }
    
    // Generic error with user-friendly message
    res.status(500).json({ 
      success: false, 
      message: "Unable to load feedback right now. Please try again in a few minutes." 
    });
  }
};
