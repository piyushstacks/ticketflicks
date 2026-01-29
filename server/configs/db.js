import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.set("bufferCommands", false);

    mongoose.connection.on("connected", () => {
      console.log("Database connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message || err);
    });

    const dbName = process.env.DB_NAME || "ticketflicks";
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
    
    const uri = `${mongoUri.replace(/\/$/, "")}/${dbName}`;

    const opts = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      // don't buffer commands -- fail fast so errors are visible
      bufferCommands: false,
    };

    await mongoose.connect(uri, opts);
  } catch (error) {
    console.error("[db.js] " + (error && error.message ? error.message : error));
    // stop startup so we don't run the server without DB
    // process.exit(1);
    console.warn("[db.js] Server starting without DB connection!");
  }
};

export default connectDB;
