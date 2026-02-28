import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    show: { type: mongoose.Schema.Types.ObjectId, ref: "Show" },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;

