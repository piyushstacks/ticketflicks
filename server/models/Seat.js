import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  screen_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Screen", 
    required: true 
  },
  category_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "SeatCategory", 
    required: true 
  },
  seat_codes: [{ 
    type: String, 
    required: true, 
    trim: true 
  }]
}, { timestamps: true });

// Index for faster queries
seatSchema.index({ screen_id: 1 });

const Seat = mongoose.model("Seat", seatSchema, "seats");

export default Seat;
