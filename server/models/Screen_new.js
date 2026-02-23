import mongoose from "mongoose";

const screenSchema = new mongoose.Schema({
  Tid: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Theater", 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  capacity: { 
    type: Number, 
    required: true, 
    min: 10 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const ScreenNew = mongoose.model("ScreenNew", screenSchema, "screens_new");

export default ScreenNew;
