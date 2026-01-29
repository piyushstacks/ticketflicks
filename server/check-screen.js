import mongoose from "mongoose";
import "dotenv/config";
import ScreenTbl from "./models/ScreenTbl.js";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const screen = await ScreenTbl.findById("697b52df3ff39d8ff991ee9a");
  console.log("Screen found:", screen ? "YES" : "NO");
  if (screen) {
    console.log("Layout:", JSON.stringify(screen.seatLayout?.layout, null, 2));
    console.log("Layout length:", screen.seatLayout?.layout?.length);
  }
  
  await mongoose.disconnect();
  process.exit(0);
}

check();
