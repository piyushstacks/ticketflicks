import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
  movie: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Movie", 
    required: true 
  },
  theatre: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Theatre", 
    required: true 
  },
  screen: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ScreenTbl", 
    required: true 
  },
  showDateTime: { 
    type: Date, 
    required: true 
  },
  showTime: {
    type: String
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  language: {
    type: String
  },
  basePrice: {
    type: Number
  },
  seatTiers: [{
    tierName: { type: String, required: true },
    price: { type: Number, required: true },
    seatsPerRow: { type: Number },
    rowCount: { type: Number },
    totalSeats: { type: Number },
    occupiedSeats: { type: mongoose.Schema.Types.Mixed, default: {} }
  }],
  totalCapacity: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for faster queries
showSchema.index({ theatre: 1, showDateTime: 1 });
showSchema.index({ movie: 1, showDateTime: 1 });

const Show = mongoose.model("Show", showSchema, "shows_new");

export default Show;
