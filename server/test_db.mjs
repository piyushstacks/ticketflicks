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
  const reviews = await db.collection("ratings_reviews").find({ type: "twitter" }).toArray();
  for (const r of reviews) {
    console.log(r._id, "movie_id:", r.movie_id, "tweet_url:", r.tweet_url, "reviews length:", r.reviews ? r.reviews.length : 0);
  }
  process.exit(0);
}
run();
