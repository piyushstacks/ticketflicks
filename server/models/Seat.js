import mongoose from "mongoose";

/**
 * SEAT_TBL
 * Each document represents a group of seats sharing the same category
 * within a screen.  Normalised: screen_id → screen_tbl, category_id → seat_categories.
 */
const seatSchema = new mongoose.Schema(
  {
    screen_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScreenTbl",          // FK → screen_tbl
      required: [true, "Screen ID is required"],
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeatCategory",       // FK → seat_categories
      required: [true, "Category ID is required"],
    },
    /**
     * An array of seat codes in this category for this screen.
     * e.g. ["A1","A2","A3", "B1","B2"]
     */
    seat_codes: [
      {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },
    ],
    /**
     * Whether these seat slots are currently bookable
     * (a manager can disable a row for maintenance)
     */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Fast look-ups by screen; unique compound index prevents
// the same seat code appearing in two categories for the same screen.
seatSchema.index({ screen_id: 1 });
seatSchema.index({ screen_id: 1, category_id: 1 });

const Seat = mongoose.model("Seat", seatSchema, "seats");

export default Seat;
