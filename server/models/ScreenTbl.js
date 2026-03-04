import mongoose from "mongoose";

/**
 * SCREEN_TBL
 * One screen belongs to one Theatre.
 * Seat layout and tier definitions are now normalised into
 * SEAT_TBL + SEAT_CATEGORY_TBL; this model only stores the structural
 * grid layout (rows × seatsPerRow) and status.
 */
const screenTblSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Screen name is required"],
    }, // e.g. "Screen 1"
    screenNumber: {
      type: String,
      required: [true, "Screen number is required"],
    }, // e.g. "1", "A"
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Theatre reference is required"],
      ref: "Theatre",             // FK → theatres
    },

    /**
     * Physical grid description.
     * Supports two formats:
     *   - Old (screen_tbl): { layout: [[String]], rows: Number, seatsPerRow: Number, totalSeats: Number }
     *   - New (screens_new): [[{ seatNumber, tier, isBooked }]]  (array-of-arrays-of-objects)
     */
    seatLayout: {
      type: mongoose.Schema.Types.Mixed,
    },

    /**
     * Seat tier definitions.
     * Supports two formats:
     *   - Old (screen_tbl): [{ tierName, price, rows: [String], seatsPerRow }]
     *   - New (screens_new): [{ name, price, color }]
     */
    seatTiers: {
      type: mongoose.Schema.Types.Mixed,
    },

    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "screens_new",
  }
);

screenTblSchema.index({ theatre: 1, isActive: 1 });
screenTblSchema.index({ theatre: 1, status: 1 });
screenTblSchema.index({ name: 1, theatre: 1 });

const ScreenTbl = mongoose.model("ScreenTbl", screenTblSchema);

export default ScreenTbl;