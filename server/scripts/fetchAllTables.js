import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import all models to register schemas
import "../models/Booking.js";
import "../models/Cast.js";
import "../models/Feedback.js";
import "../models/Genre.js";
import "../models/Language.js";
import "../models/Movie.js";
import "../models/Otp.js";
import "../models/Payment.js";
import "../models/RatingsReview.js";
import "../models/Screen.js";
import "../models/ScreenTbl.js";
import "../models/Seat.js";
import "../models/SeatCategory.js";
import "../models/Theatre.js";
import "../models/User.js";
import "../models/show_tbls.js";

const DB_NAME = process.env.DB_NAME || "ticketflicks";

async function fetchAllTables() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const uri = `${mongoUri.replace(/\/$/, "")}/${DB_NAME}`;
    console.log(`\n🔗 Connecting to database: ${DB_NAME}...\n`);

    await mongoose.connect(uri);
    console.log("✅ Connected successfully!\n");

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("=".repeat(80));
    console.log("📋 COLLECTIONS IN DATABASE: " + DB_NAME);
    console.log("=".repeat(80) + "\n");

    const output = {
      database: DB_NAME,
      timestamp: new Date().toISOString(),
      collections: [],
    };

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📦 Collection: ${collectionName}`);
      console.log("-".repeat(60));

      // Get collection stats using aggregate (stats() is deprecated)
      let sizeBytes = 0;
      try {
        const statsResult = await mongoose.connection.db
          .collection(collectionName)
          .aggregate([{ $collStats: { storageStats: {} } }])
          .toArray();
        sizeBytes = statsResult[0]?.storageStats?.size || 0;
      } catch (e) {
        // Fallback if collStats not supported
        console.log(`   Note: Could not get storage stats for ${collectionName}`);
      }
      
      // Get sample documents
      const sampleDocs = await mongoose.connection.db
        .collection(collectionName)
        .find({})
        .limit(5)
        .toArray();

      // Get indexes
      const indexes = await mongoose.connection.db
        .collection(collectionName)
        .indexes();

      // Get document count
      const count = await mongoose.connection.db
        .collection(collectionName)
        .countDocuments();

      const collectionInfo = {
        name: collectionName,
        documentCount: count,
        sizeBytes: sizeBytes,
        sizeMB: (sizeBytes / 1024 / 1024).toFixed(3),
        indexes: indexes.map((idx) => ({
          name: idx.name,
          keys: idx.key,
        })),
        sampleDocuments: sampleDocs,
        inferredSchema: inferSchema(sampleDocs),
      };

      output.collections.push(collectionInfo);

      console.log(`   Documents: ${count}`);
      console.log(`   Size: ${collectionInfo.sizeMB} MB`);
      console.log(`   Indexes: ${indexes.length}`);
    }

    // Write output to JSON file
    const outputPath = path.join(__dirname, "database_schema_output.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n\n✅ Schema output written to: ${outputPath}`);

    // Generate markdown documentation
    const markdownPath = path.join(__dirname, "DATABASE_SCHEMA.md");
    const markdown = generateMarkdown(output);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📝 Markdown documentation written to: ${markdownPath}\n`);

    await mongoose.connection.close();
    console.log("🔌 Database connection closed.\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

function inferSchema(documents) {
  if (!documents || documents.length === 0) {
    return { message: "No documents found to infer schema" };
  }

  const schema = {};

  for (const doc of documents) {
    for (const [key, value] of Object.entries(doc)) {
      if (!schema[key]) {
        schema[key] = {
          types: new Set(),
          sampleValues: [],
          required: false,
        };
      }

      if (value !== null && value !== undefined) {
        const type = getValueType(value);
        schema[key].types.add(type);

        if (schema[key].sampleValues.length < 3) {
          schema[key].sampleValues.push(
            typeof value === "object" ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100)
          );
        }
      }
    }
  }

  // Convert Sets to arrays for JSON serialization
  for (const [key, value] of Object.entries(schema)) {
    schema[key].types = Array.from(value.types);
    schema[key].sampleValues = value.sampleValues;
  }

  return schema;
}

function getValueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length > 0) {
      return `Array<${getValueType(value[0])}>`;
    }
    return "Array";
  }
  if (value instanceof Date) return "Date";
  if (typeof value === "object") {
    if (value._bsontype === "ObjectId") return "ObjectId";
    return "Object";
  }
  return typeof value;
}

function generateMarkdown(data) {
  let md = `# Database Schema: ${data.database}

> Generated on: ${data.timestamp}

## Overview

| Collection | Documents | Size (MB) | Indexes |
|------------|-----------|-----------|---------|
${data.collections.map((c) => `| ${c.name} | ${c.documentCount} | ${c.sizeMB} | ${c.indexes.length} |`).join("\n")}

---

`;

  for (const collection of data.collections) {
    md += `## ${collection.name}

### Statistics
- **Document Count**: ${collection.documentCount}
- **Size**: ${collection.sizeMB} MB
- **Indexes**: ${collection.indexes.length}

### Indexes
| Index Name | Keys |
|------------|------|
${collection.indexes.map((idx) => `| ${idx.name} | \`${JSON.stringify(idx.keys)}\` |`).join("\n")}

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
${Object.entries(collection.inferredSchema)
  .filter(([key]) => key !== "message")
  .map(([field, info]) => {
    const types = info.types ? info.types.join(", ") : "unknown";
    const samples = info.sampleValues ? info.sampleValues.map((v) => `\`${v}\``).join("<br>") : "-";
    return `| ${field} | ${types} | ${samples} |`;
  })
  .join("\n")}

### Sample Document
\`\`\`json
${JSON.stringify(collection.sampleDocuments[0] || {}, null, 2)}
\`\`\`

---

`;
  }

  // Add Mongoose Schema Reference section
  md += `## Mongoose Schema Reference

The following schemas are defined in the application:

### 1. User (\`users_new\`)
\`\`\`javascript
{
  name: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  phone: String (required, 10-digit validation),
  password_hash: String (required, hidden from queries),
  role: String (enum: ["customer", "manager", "admin"], required),
  last_login: Date,
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: email, role
\`\`\`

### 2. Theatre (\`theatres\`)
\`\`\`javascript
{
  name: String (required, trimmed),
  location: String (required, trimmed),
  manager_id: ObjectId (ref: "User", required),
  contact_no: String (trimmed),
  email: String (trimmed, lowercase),
  address: String (trimmed),
  city: String (trimmed),
  state: String (trimmed),
  zipCode: String (trimmed),
  step3_pdf_url: String (trimmed),
  approval_status: String (enum: ["pending", "approved", "declined"], default: "pending"),
  approval_date: Date,
  disabled: Boolean (default: false),
  disabled_date: Date,
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: manager_id, approval_status, location
\`\`\`

### 3. Movie (\`movies_new\`)
\`\`\`javascript
{
  title: String (required, unique, trimmed),
  genre_ids: [ObjectId] (ref: "Genre", required),
  language_id: [ObjectId] (ref: "Language", required),
  duration_min: Number (required, min: 1),
  release_date: Date (required),
  description: String (required, trimmed),
  poster_path: String (trimmed),
  backdrop_path: String (trimmed),
  trailer_link: String (trimmed),
  cast: [ObjectId] (ref: "Cast", required),
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: title, release_date
\`\`\`

### 4. Show (\`shows_new\`)
\`\`\`javascript
{
  movie: ObjectId (ref: "Movie", required),
  theatre: ObjectId (ref: "Theatre", required),
  screen: ObjectId (ref: "ScreenTbl", required),
  showDateTime: Date (required),
  showTime: String,
  startDate: Date,
  endDate: Date,
  language: String,
  basePrice: Number,
  seatTiers: [{
    tierName: String (required),
    price: Number (required),
    seatsPerRow: Number,
    rowCount: Number,
    totalSeats: Number,
    occupiedSeats: Mixed (default: {})
  }],
  totalCapacity: Number,
  isActive: Boolean (default: true)
}
// Timestamps: createdAt, updatedAt
// Indexes: theatre+showDateTime, movie+showDateTime
\`\`\`

### 5. Screen (\`screens_new\`)
\`\`\`javascript
{
  Tid: ObjectId (ref: "Theatre", required),
  name: String (required, trimmed),
  screenNumber: String (trimmed),
  capacity: Number (required, min: 10),
  seatLayout: {
    layout: [[String]],
    rows: Number,
    seatsPerRow: Number,
    totalSeats: Number
  },
  seatTiers: [{
    tierName: String,
    price: Number,
    rows: [String],
    seatsPerRow: Number
  }],
  isActive: Boolean (default: true),
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: Tid
\`\`\`

### 6. ScreenTbl (\`screen_tbl\`)
\`\`\`javascript
{
  name: String (required),
  screenNumber: String (required),
  theatre: ObjectId (ref: "Theatre", required),
  seatLayout: {
    layout: [[String]] (required),
    rows: Number (required),
    seatsPerRow: Number (required),
    totalSeats: Number (required)
  },
  seatTiers: [{
    tierName: String (required),
    price: Number (required),
    rows: [String],
    seatsPerRow: Number
  }],
  isActive: Boolean (default: true),
  status: String (enum: ['active', 'inactive', 'maintenance'], default: 'active'),
  createdBy: ObjectId (ref: "User"),
  lastModifiedBy: ObjectId (ref: "User")
}
// Timestamps: created_at, updated_at
// Indexes: theatre+isActive, theatre+status, name+theatre
\`\`\`

### 7. Booking (\`bookings_new\`)
\`\`\`javascript
{
  user_id: ObjectId (ref: "User", required),
  show_id: ObjectId (ref: "Show", required),
  seats_booked: [ObjectId] (ref: "Seat", required),
  total_amount: Number (required, min: 0),
  status: String (enum: ["confirmed", "cancelled", "pending"], default: "pending"),
  payment_link: String (trimmed),
  isPaid: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: user_id+createdAt, show_id
\`\`\`

### 8. Payment (\`payments\`)
\`\`\`javascript
{
  booking_id: ObjectId (ref: "Booking", required),
  amount: Number (required),
  method: String (enum: ["UPI", "card", "netbanking", "wallet"], required),
  status: String (enum: ["success", "failed", "refunded", "pending"], default: "pending"),
  transaction_id: String (required, unique, trimmed),
  payment_time: Date (required, default: Date.now)
}
// Timestamps: createdAt, updatedAt
// Indexes: booking_id
\`\`\`

### 9. Seat (\`seats\`)
\`\`\`javascript
{
  screen_id: ObjectId (ref: "Screen", required),
  category_id: ObjectId (ref: "SeatCategory", required),
  seat_codes: [String] (required, trimmed)
}
// Timestamps: createdAt, updatedAt
// Indexes: screen_id
\`\`\`

### 10. SeatCategory (\`seat_categories\`)
\`\`\`javascript
{
  name: String (required, trimmed),
  price: Number (required, min: 0),
  description: String (trimmed)
}
// Timestamps: createdAt, updatedAt
\`\`\`

### 11. Genre (\`genres\`)
\`\`\`javascript
{
  name: String (required, unique, trimmed),
  description: String (trimmed)
}
// Timestamps: createdAt, updatedAt
\`\`\`

### 12. Language (\`languages\`)
\`\`\`javascript
{
  name: String (required, unique, trimmed),
  code: String (required, trimmed),
  region: String (trimmed)
}
// Timestamps: createdAt, updatedAt
\`\`\`

### 13. Cast (\`casts\`)
\`\`\`javascript
{
  name: String (required, trimmed),
  bio: String (trimmed),
  dob: Date
}
// Timestamps: createdAt, updatedAt
\`\`\`

### 14. RatingsReview (\`ratings_reviews\`)
\`\`\`javascript
{
  movie_id: ObjectId (ref: "Movie", required),
  user_id: ObjectId (ref: "User", required),
  rating: Number (required, min: 0, max: 5),
  review: String (trimmed)
}
// Timestamps: createdAt, updatedAt
// Indexes: movie_id, user_id
\`\`\`

### 15. Feedback (\`feedbacks\`)
\`\`\`javascript
{
  user: String (required, ref: "User"),
  show: ObjectId (ref: "Show"),
  theatre: ObjectId (ref: "Theatre"),
  rating: Number (required, min: 1, max: 5),
  message: String
}
// Timestamps: createdAt, updatedAt
\`\`\`

### 16. Otp (\`otp_tbls\`)
\`\`\`javascript
{
  email: String (required, indexed, lowercase, trimmed),
  otpHash: String (required),
  purpose: String (enum: ["login", "forgot", "signup", "theatre-registration"], default: "login"),
  expiresAt: Date (required)
}
// Timestamps: createdAt, updatedAt
\`\`\`

---

## Entity Relationship Diagram

\`\`\`
User ──┬── manages ──→ Theatre
       │                  │
       │                  ├── has ──→ Screen/ScreenTbl
       │                  │              │
       │                  │              └── has ──→ Seat
       │                  │
       │                  └── hosts ──→ Show ──→ Movie
       │                                    │
       │                                    └── has ──→ Booking
       │                                                   │
       │                                                   └── has ──→ Payment
       │
       ├── writes ──→ RatingsReview ──→ Movie
       │
       └── sends ──→ Feedback

Movie ──┬── belongs to ──→ Genre
        ├── in ──→ Language
        └── features ──→ Cast
\`\`\`

---

*Generated by fetchAllTables.js script*
`;

  return md;
}

fetchAllTables();
