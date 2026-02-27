import mongoose from "mongoose";

const screenSchema = new mongoose.Schema({
  Tid: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Theatre", 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  screenNumber: {
    type: String,
    trim: true
  },
  capacity: { 
    type: Number, 
    required: true, 
    min: 10 
  },
  seatLayout: {
    layout: [[String]],
    rows: Number,
    seatsPerRow: Number,
    totalSeats: Number
  },
  seatTiers: [{
    tierName: String,
    price: Number,
    rows: [String],
    seatsPerRow: Number
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Index for faster queries
screenSchema.index({ Tid: 1 });

const Screen = mongoose.model("Screen", screenSchema, "screens_new");

export default Screen;
