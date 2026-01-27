import mongoose from "mongoose";

const showSchema = mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Movie",
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Theatre",
    },
    screen: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Screen",
    },
    showDateTime: { type: Date, required: true },
    basePrice: { type: Number, required: true },
    language: { type: String, default: "en" },
    seatTiers: [
      {
        tierName: { type: String, required: true }, // e.g., "Standard", "Premium"
        price: { type: Number, required: true },
        seatsPerRow: { type: Number, default: 20 },
        rowCount: { type: Number, default: 10 },
        totalSeats: { type: Number },
        occupiedSeats: { type: Object, default: {} }, // e.g., { "A1": "userId", "B5": "userId" }
      },
    ],
    totalCapacity: { type: Number, required: true },
    occupiedSeatsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { minimize: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Show = mongoose.model("Show", showSchema, "show_tbls");

export default Show;
