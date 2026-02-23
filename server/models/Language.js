import mongoose from "mongoose";

const languageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  code: { 
    type: String, 
    required: true, 
    trim: true 
  },
  region: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

const Language = mongoose.model("Language", languageSchema, "languages");

export default Language;
