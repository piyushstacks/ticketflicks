import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const MONGO_URI = process.env.MONGODB_URI;

const client = new MongoClient(MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false });

async function run() {
  await client.connect();
  const db = client.db("ticketflicks");
  const bookings = db.collection("bookings_new");

  const allBookings = await bookings.find({}).toArray();
  for (const b of allBookings) {
    if (b.payment_status !== "completed") {
      console.log(b._id, "isPaid:", b.isPaid, "payment_status:", b.payment_status, "status:", b.status);
    }
  }
  process.exit(0);
}
run();
