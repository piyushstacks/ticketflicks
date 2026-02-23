import mongoose from "mongoose";

const genreSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

const Genre = mongoose.model("Genre", genreSchema, "genres");

export default Genre;
