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
    email: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    zipCode: {
      type: String,
      required: false,
      trim: true,
    },
    approval_status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
    approval_date: {
      type: Date,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    disabled_date: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Theatre = mongoose.model("Theatre", theatreSchema);

export default Theatre;
