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
    ref: "User", 
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
  approval_date: {
    type: Date
  },
  disabled: { 
    type: Boolean, 
    default: false 
  },
  disabled_date: {
    type: Date
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Index for faster queries
theaterSchema.index({ manager_id: 1 });
theaterSchema.index({ approval_status: 1 });
theaterSchema.index({ location: 1 });

const Theatre = mongoose.model("Theatre", theaterSchema, "theatres");

export default Theatre;
