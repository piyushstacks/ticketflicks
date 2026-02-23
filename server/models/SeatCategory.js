import mongoose from "mongoose";

const seatCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  description: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

const SeatCategory = mongoose.model("SeatCategory", seatCategorySchema, "seat_categories");

export default SeatCategory;
