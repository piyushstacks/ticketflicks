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
  u_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  contact_no: { 
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

const TheaterNew = mongoose.model("TheaterNew", theaterSchema, "theaters_new");

export default TheaterNew;
