import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
  movie_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Movie", 
    required: true 
  },
  theater_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Theater", 
    required: true 
  },
  screen_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Screen", 
    required: true 
  },
  show_date: { 
    type: Date, 
    required: true 
  },
  available_seats: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Seat" 
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
showSchema.index({ theater_id: 1, show_date: 1 });
showSchema.index({ movie_id: 1, show_date: 1 });

const ShowNew = mongoose.model("ShowNew", showSchema, "shows_new");

export default ShowNew;
