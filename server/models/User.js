import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Email is required"],
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  phone: { 
    type: String, 
    required: [true, "Phone is required"],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: "Phone must be a valid 10-digit number"
    }
  },
  password_hash: { 
    type: String, 
    required: true, 
    select: false 
  },
  role: { 
    type: String, 
    required: true, 
    enum: {
      values: ["customer", "manager", "admin"],
      message: "Role must be customer, manager, or admin"
    }
  },
  // For managers - reference to managed theatre
  managedTheatreId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Theatre",
    default: null
  },
  // User's favorite movies
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie"
  }],
  last_login: { 
    type: Date 
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ managedTheatreId: 1 });
userSchema.index({ isDeleted: 1 });

// Query middleware to exclude deleted users by default
userSchema.pre(/^find/, function() {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const User = mongoose.model("User", userSchema, "users_new");

export default User;
