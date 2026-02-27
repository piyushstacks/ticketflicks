import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  location: { 
    type: String, 
    required: true, 
    trim: true 
  },
  manager_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "UserNew", 
    required: true 
  },
  contact_no: { 
    type: String, 
    trim: true 
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  step3_pdf_url: {
    type: String,
    trim: true
  },
  approval_status: { 
    type: String, 
    enum: ["pending", "approved", "declined"], 
    default: "pending" 
  },
  disabled: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const TheaterNew = mongoose.model("TheaterNew", theaterSchema, "theatres");

export default TheaterNew;
