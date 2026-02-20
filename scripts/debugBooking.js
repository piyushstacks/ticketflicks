import mongoose from "mongoose";
import dotenv from "dotenv";
import Show from "../server/models/Show.js";
import ScreenTbl from "../server/models/ScreenTbl.js";
import Movie from "../server/models/Movie.js";
import Theatre from "../server/models/Theatre.js";
import Booking from "../server/models/Booking.js";
import User from "../server/models/User.js";

dotenv.config({ path: "./server/.env" });

const SEAT_CODE_MAP = {
  S: { tierName: "Standard", basePrice: 150 },
  D: { tierName: "Deluxe", basePrice: 200 },
  P: { tierName: "Premium", basePrice: 250 },
  R: { tierName: "Recliner", basePrice: 350 },
  C: { tierName: "Couple", basePrice: 500 },
};

const getSeatCodeFromLayout = (seatLayout, seatNumber) => {
  if (!seatLayout?.layout || !Array.isArray(seatLayout.layout)) return null;

  const rowLetter = String(seatNumber || "").charAt(0);
  const colNumberRaw = String(seatNumber || "").slice(1);
  const rowIndex = rowLetter.toUpperCase().charCodeAt(0) - 65;
  const colIndex = Number.parseInt(colNumberRaw, 10) - 1;
  if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex)) return null;
  if (rowIndex < 0 || colIndex < 0) return null;

  const row = seatLayout.layout[rowIndex];
  if (!Array.isArray(row)) return null;
  if (colIndex >= row.length) return null;

  return row[colIndex]?.code || (typeof row[colIndex] === 'string' ? row[colIndex] : null);
};

const getTierInfoForSeat = (show, seatNumber) => {
  const screen = show.screen;

  console.log(`Debug: Checking seat ${seatNumber} for show ${show._id}`);
  console.log(`Debug: Screen ID: ${screen?._id}`);
  
  // Prefer explicit tier configuration by rows (if present)
  if (screen?.seatTiers && Array.isArray(screen.seatTiers) && screen.seatTiers.length > 0) {
    const row = seatNumber.charAt(0);
    console.log(`Debug: Checking screen seatTiers for row ${row}`);
    for (const tier of screen.seatTiers) {
      const rows = tier.rows || [];
      if (rows.includes(row)) {
        console.log(`Debug: Found row ${row} in tier ${tier.tierName}`);
        // If show has override price for this tier, use it
        if (show.seatTiers && Array.isArray(show.seatTiers)) {
          const showTier = show.seatTiers.find((t) => t.tierName === tier.tierName);
          if (showTier && typeof showTier.price === "number") {
            console.log(`Debug: Show overrides price: ${showTier.price}`);
            return { tierName: tier.tierName, price: showTier.price };
          }
        }
        console.log(`Debug: Using screen price: ${tier.price}`);
        return { tierName: tier.tierName, price: tier.price };
      }
    }
  }

  // Fallback: derive from seatLayout seat code (S/D/P/R/C)
  const seatCode = getSeatCodeFromLayout(screen?.seatLayout, seatNumber);
  console.log(`Debug: Seat code from layout: ${seatCode}`);
  
  const mapped = SEAT_CODE_MAP[seatCode];
  if (!mapped) {
    console.log(`Debug: No mapping found for code ${seatCode}`);
    return null;
  }

  // If show has tier prices configured with same names, prefer those prices
  if (show.seatTiers && Array.isArray(show.seatTiers) && show.seatTiers.length > 0) {
    const showTier = show.seatTiers.find((t) => t.tierName === mapped.tierName);
    if (showTier && typeof showTier.price === "number") {
      console.log(`Debug: Show overrides price (mapped): ${showTier.price}`);
      return { tierName: showTier.tierName, price: showTier.price };
    }
  }

  // If screen has tier prices configured with same names, prefer those prices
  if (screen?.seatTiers && Array.isArray(screen.seatTiers) && screen.seatTiers.length > 0) {
    const exactTier = screen.seatTiers.find((t) => t.tierName === mapped.tierName);
    if (exactTier && typeof exactTier.price === "number") {
      console.log(`Debug: Screen overrides price (mapped): ${exactTier.price}`);
      return { tierName: exactTier.tierName, price: exactTier.price };
    }
  }

  console.log(`Debug: Using base price: ${mapped.basePrice}`);
  return { tierName: mapped.tierName, price: mapped.basePrice };
};

const debug = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find a show
    const show = await Show.findOne({ isActive: true })
      .populate("movie")
      .populate("theatre")
      .populate("screen")
      .sort({ createdAt: -1 });

    if (!show) {
      console.log("No active show found");
      return;
    }

    console.log(`Testing with Show ID: ${show._id}`);
    console.log(`Screen: ${show.screen?.name} (${show.screen?._id})`);
    
    // Pick a seat from the layout
    let testSeat = "A1";
    if (show.screen?.seatLayout?.layout) {
        // Find a valid seat in the layout
        show.screen.seatLayout.layout.forEach((row, rIndex) => {
            row.forEach((code, cIndex) => {
                if (code && code !== "") {
                    testSeat = `${String.fromCharCode(65 + rIndex)}${cIndex + 1}`;
                }
            });
        });
    }
    
    console.log(`Testing Seat: ${testSeat}`);

    const tierInfo = getTierInfoForSeat(show, testSeat);
    console.log("Result:", tierInfo);

    if (!tierInfo) {
        console.error("FAILED: tierInfo is null");
        return;
    }

    // Simulate validation
    const bookingData = {
      user: new mongoose.Types.ObjectId(), // Fake user
      show: show._id,
      theatre: show.theatre._id,
      screen: show.screen._id,
      bookedSeats: [{
        seatNumber: testSeat,
        tierName: tierInfo.tierName,
        price: tierInfo.price,
      }],
      amount: tierInfo.price,
      isPaid: false,
    };

    console.log("Booking Data:", JSON.stringify(bookingData, null, 2));

    const booking = new Booking(bookingData);
    const error = booking.validateSync();

    if (error) {
      console.error("Validation Error:", JSON.stringify(error.errors, null, 2));
    } else {
      console.log("Validation PASSED");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
};

debug();
