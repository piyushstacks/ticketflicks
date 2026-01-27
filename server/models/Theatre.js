import mongoose from "mongoose";

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    manager_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contact_no: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      required: false,
    },
    zipCode: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    screens: [
      {
        name: {
          type: String,
          required: true,
        },
        layout: {
          type: {
            name: String,
            rows: Number,
            seatsPerRow: Number,
            totalSeats: Number,
            layout: [[String]]
          },
          required: true,
        },
        pricing: {
          type: mongoose.Schema.Types.Mixed, // Can be tier-based or unified
          required: true,
        },
        totalSeats: {
          type: Number,
          required: true,
        },
        status: {
          type: String,
          enum: ['active', 'inactive', 'maintenance'],
          default: 'active'
        }
      },
    ],
  },
  { timestamps: true }
);

const Theatre = mongoose.model("Theatre", theatreSchema);

export default Theatre;
