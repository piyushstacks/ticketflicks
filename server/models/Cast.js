import mongoose from "mongoose";

const castSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  bio: { 
    type: String, 
    trim: true 
  },
  dob: { 
    type: Date 
  }
}, { timestamps: true });

const Cast = mongoose.model("Cast", castSchema, "casts");

export default Cast;
