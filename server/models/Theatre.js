import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Theatre name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  location: { 
    type: String, 
    required: [true, "Location is required"],
    trim: true
  },
  manager_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "Manager ID is required"],
    validate: {
      isAsync: true,
      validator: async function(v) {
        if (!v) return false;
        const user = await mongoose.model("User").findById(v);
        return user && user.role === "manager";
      },
      message: "Manager ID must reference a manager user"
    }
  },
  contact_no: { 
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: "Contact number must be 10 digits"
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
  },
  address: {
    type: String,
    trim: true,
    default: null
  },
  city: {
    type: String,
    trim: true,
    default: null
  },
  state: {
    type: String,
    trim: true,
    default: null
  },
  zipCode: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^\d{5,10}$/.test(v);
      },
      message: "Zip code must be 5-10 digits"
    }
  },
  // Document storage
  step3_pdf_url: {
    type: String,
    trim: true,
    default: null
  },
  // Approval workflow
  approval_status: { 
    type: String, 
    enum: {
      values: ["pending", "approved", "declined"],
      message: "Status must be pending, approved, or declined"
    },
    default: "pending" 
  },
  approval_date: {
    type: Date,
    default: null
  },
  approval_notes: {
    type: String,
    default: null
  },
  // Operational status
  disabled: { 
    type: Boolean, 
    default: false 
  },
  disabled_reason: {
    type: String,
    default: null
  },
  disabled_date: {
    type: Date,
    default: null
  },
  // Soft delete
  isDeleted: { 
    type: Boolean, 
    default: false,
    select: false
  }
}, { timestamps: true });

// Indexes for faster queries
theaterSchema.index({ manager_id: 1 });
theaterSchema.index({ approval_status: 1 });
theaterSchema.index({ location: 1 });
theaterSchema.index({ city: 1 });
theaterSchema.index({ isDeleted: 1 });

// Query middleware to exclude deleted theatres by default
theaterSchema.pre(/^find/, function() {
  if (this.getOptions()?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Theatre = mongoose.model("Theatre", theaterSchema, "theatres");

export default Theatre;
