import mongoose from "mongoose";

/**
 * SEAT_CATEGORY_TBL
 * Defines named categories of seats (e.g. Normal, Gold, Platinum).
 * Referenced by Seat → Screen → Booking.
 */
const seatCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      enum: {
        values: ["Normal", "Gold", "Platinum", "Recliner", "Couple"],
        message: "Name must be Normal, Gold, Platinum, Recliner or Couple",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const SeatCategory = mongoose.model(
  "SeatCategory",
  seatCategorySchema,
  "seat_categories"
);

export default SeatCategory;
