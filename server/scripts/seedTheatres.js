/**
 * seedTheatres.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Removes demo/dummy theatres
 * 2. Seeds realistic theatre chains across major Indian cities
 * 3. Creates screens with proper seating layouts for each theatre
 * 4. Assigns shows with current movies
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ticketflicks";
const uri = `${MONGODB_URI.replace(/\/$/, "")}/${dbName}`;

// ── Realistic Theatre Chains in India (10 theatres) ────────────────────────────────────────
const REALISTIC_THEATRES = [
  // Mumbai
  {
    name: "PVR ICONX Oberoi Mall",
    location: "Oberoi Mall, Goregaon East",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Oberoi Mall, Off Western Express Highway, Goregaon East",
    zipCode: "400063",
    contact_no: "02240324032",
    email: "oberoi@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "4DX", type: "4dx", rows: 10, seatsPerRow: 16 },
      { name: "Screen 3 - Premium", type: "premium", rows: 12, seatsPerRow: 18 },
      { name: "Screen 4 - Gold", type: "gold", rows: 10, seatsPerRow: 14 },
    ]
  },
  {
    name: "INOX R-City Mall",
    location: "R-City Mall, Ghatkopar West",
    city: "Mumbai",
    state: "Maharashtra",
    address: "R-City Mall, LBS Marg, Ghatkopar West",
    zipCode: "400086",
    contact_no: "02267878888",
    email: "rcity@inoxmovies.com",
    screens: [
      { name: "MX4D", type: "4dx", rows: 10, seatsPerRow: 16 },
      { name: "Screen 2", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4 - Premiere", type: "premium", rows: 8, seatsPerRow: 12 },
    ]
  },

  // Delhi NCR
  {
    name: "PVR Directors Cut Select City Walk",
    location: "Select City Walk Mall, Saket",
    city: "Delhi",
    state: "Delhi",
    address: "Select City Walk Mall, District Centre, Saket",
    zipCode: "110017",
    contact_no: "01140324030",
    email: "directorscut@pvrcinemas.com",
    screens: [
      { name: "Screen 1 - Luxe", type: "premium", rows: 8, seatsPerRow: 12 },
      { name: "Screen 2 - Luxe", type: "premium", rows: 8, seatsPerRow: 12 },
      { name: "Screen 3", type: "standard", rows: 10, seatsPerRow: 14 },
      { name: "Screen 4", type: "standard", rows: 10, seatsPerRow: 14 },
    ]
  },
  {
    name: "INOX DLF Promenade",
    location: "DLF Promenade Mall, Vasant Kunj",
    city: "Delhi",
    state: "Delhi",
    address: "DLF Promenade Mall, Vasant Kunj",
    zipCode: "110070",
    contact_no: "01146111111",
    email: "dlfpromenade@inoxmovies.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "Screen 2 - Premiere", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
    ]
  },

  // Bangalore
  {
    name: "PVR Forum Mall Koramangala",
    location: "Forum Mall, Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    address: "Forum Mall, Hosur Road, Koramangala",
    zipCode: "560095",
    contact_no: "08041444444",
    email: "forum@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "Screen 2 - Gold", type: "gold", rows: 8, seatsPerRow: 12 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 5", type: "standard", rows: 10, seatsPerRow: 14 },
    ]
  },

  // Hyderabad
  {
    name: "PVR ICONX GVK One Mall",
    location: "GVK One Mall, Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    address: "GVK One Mall, Road No.1, Banjara Hills",
    zipCode: "500034",
    contact_no: "04040324030",
    email: "gvkone@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "4DX", type: "4dx", rows: 10, seatsPerRow: 16 },
      { name: "Screen 3 - Premium", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
    ]
  },

  // Chennai
  {
    name: "PVR VR Chennai",
    location: "VR Chennai Mall, Anna Nagar",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "VR Chennai Mall, Anna Nagar West",
    zipCode: "600040",
    contact_no: "04440324030",
    email: "vrchennai@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "Screen 2 - Premium", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
    ]
  },
  {
    name: "Sathyam Cinemas",
    location: "Royapettah",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Sathyam Cinemas, Royapettah",
    zipCode: "600014",
    contact_no: "04428201212",
    email: "info@sathyamcinemas.com",
    screens: [
      { name: "Sathyam - Big", type: "imax", rows: 16, seatsPerRow: 24 },
      { name: "Santham", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Sangam", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Sivam", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Sunam", type: "standard", rows: 10, seatsPerRow: 14 },
    ]
  },

  // Pune
  {
    name: "PVR Phoenix Marketcity Pune",
    location: "Phoenix Marketcity Mall, Viman Nagar",
    city: "Pune",
    state: "Maharashtra",
    address: "Phoenix Marketcity Mall, Viman Nagar",
    zipCode: "411014",
    contact_no: "02040324030",
    email: "phoenixpune@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "Screen 2 - Premium", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
    ]
  },

  // Kolkata
  {
    name: "PVR Acropolis Mall",
    location: "Acropolis Mall, Kasba",
    city: "Kolkata",
    state: "West Bengal",
    address: "Acropolis Mall, Kasba Industrial Estate",
    zipCode: "700107",
    contact_no: "03340324030",
    email: "acropolis@pvrcinemas.com",
    screens: [
      { name: "IMAX", type: "imax", rows: 14, seatsPerRow: 20 },
      { name: "Screen 2 - Premium", type: "premium", rows: 10, seatsPerRow: 14 },
      { name: "Screen 3", type: "standard", rows: 12, seatsPerRow: 16 },
      { name: "Screen 4", type: "standard", rows: 12, seatsPerRow: 16 },
    ]
  },
];

// ── Seat tier config by screen type ──────────────────────────────────────────
const SCREEN_TYPE_TIERS = {
  imax: [
    { name: "Silver", price: 250, color: "#6B7280" },
    { name: "Gold", price: 350, color: "#F59E0B" },
    { name: "Platinum", price: 450, color: "#8B5CF6" },
  ],
  "4dx": [
    { name: "Silver", price: 300, color: "#6B7280" },
    { name: "Gold", price: 400, color: "#F59E0B" },
    { name: "Platinum", price: 500, color: "#8B5CF6" },
  ],
  premium: [
    { name: "Silver", price: 200, color: "#6B7280" },
    { name: "Gold", price: 280, color: "#F59E0B" },
    { name: "Platinum", price: 380, color: "#8B5CF6" },
  ],
  gold: [
    { name: "Silver", price: 180, color: "#6B7280" },
    { name: "Gold", price: 250, color: "#F59E0B" },
  ],
  standard: [
    { name: "Silver", price: 150, color: "#6B7280" },
    { name: "Gold", price: 220, color: "#F59E0B" },
  ],
};

// ── Show times (hours, minutes) ───────────────────────────────────────────────
const SHOW_SLOTS = [
  { h: 10, m: 0, label: "Morning" },
  { h: 13, m: 0, label: "Afternoon" },
  { h: 16, m: 30, label: "Evening" },
  { h: 19, m: 30, label: "Night" },
  { h: 22, m: 30, label: "Late Night" },
];

function buildShowDateTime(daysFromNow, slotH, slotM) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(slotH, slotM, 0, 0);
  return d;
}

function makeScreenLayout(rows, seatsPerRow, tiers) {
  const layout = [];
  const tierCount = tiers.length;
  const rowsPerTier = Math.ceil(rows / tierCount);
  
  for (let r = 0; r < rows; r++) {
    const row = [];
    // Determine tier based on row position
    let tierIndex = Math.floor(r / rowsPerTier);
    if (tierIndex >= tierCount) tierIndex = tierCount - 1;
    const tier = tiers[tierIndex].name;
    
    for (let s = 1; s <= seatsPerRow; s++) {
      row.push({ 
        seatNumber: `${String.fromCharCode(65 + r)}${s}`, 
        tier, 
        isBooked: false 
      });
    }
    layout.push(row);
  }
  return layout;
}

async function run() {
  await mongoose.connect(uri);
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  const db = mongoose.connection.db;

  // ── 1. Remove ALL existing theatres ──────────────────────────────────────────
  console.log("\n🗑️  Removing ALL existing theatres...");
  
  const allTheatres = await db.collection("theatres").find({}).toArray();
  
  if (allTheatres.length > 0) {
    const allIds = allTheatres.map(t => t._id);
    
    // Delete associated screens and shows
    await db.collection("screens_new").deleteMany({ theatre: { $in: allIds } });
    await db.collection("shows_new").deleteMany({ theatre: { $in: allIds } });
    await db.collection("theatres").deleteMany({});
    
    console.log(`   Removed ${allTheatres.length} theatres and associated data`);
  } else {
    console.log("   No theatres found");
  }

  // ── 2. Get or create a manager user for theatres ────────────────────────────
  let manager = await db.collection("users_new").findOne({ role: "manager" });
  if (!manager) {
    // Create a default manager
    const managerResult = await db.collection("users_new").insertOne({
      name: "Theatre Manager",
      email: "manager@ticketflicks.com",
      phone: "9876543210",
      password_hash: "$2b$12$dummyHashForSeedScript", // Not used for login
      role: "manager",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    manager = await db.collection("users_new").findOne({ _id: managerResult.insertedId });
    console.log("   Created default manager user");
  }

  // ── 3. Seed realistic theatres ──────────────────────────────────────────────
  console.log("\n🎬 Seeding realistic theatres...");
  
  const screensByTheatre = {};
  
  for (const theatreData of REALISTIC_THEATRES) {
    // Create theatre document
    const theatreDoc = {
      _id: new mongoose.Types.ObjectId(),
      name: theatreData.name,
      location: theatreData.location,
      city: theatreData.city,
      state: theatreData.state,
      address: theatreData.address,
      zipCode: theatreData.zipCode,
      contact_no: theatreData.contact_no,
      email: theatreData.email,
      manager_id: manager._id,
      approval_status: "approved",
      approval_date: new Date(),
      disabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection("theatres").insertOne(theatreDoc);
    
    // Create screens for this theatre
    const screens = [];
    for (let i = 0; i < theatreData.screens.length; i++) {
      const screenData = theatreData.screens[i];
      const screenType = screenData.type || "standard";
      const tiers = SCREEN_TYPE_TIERS[screenType] || SCREEN_TYPE_TIERS.standard;
      const layout = makeScreenLayout(screenData.rows, screenData.seatsPerRow, tiers);
      
      const screenDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: screenData.name,
        screenNumber: String(i + 1),
        theatre: theatreDoc._id,
        seatLayout: layout,
        seatTiers: tiers,
        totalSeats: screenData.rows * screenData.seatsPerRow,
        rows: screenData.rows,
        seatsPerRow: screenData.seatsPerRow,
        isActive: true,
        status: "active",
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await db.collection("screens_new").insertOne(screenDoc);
      screens.push(screenDoc);
    }
    
    screensByTheatre[theatreDoc._id.toString()] = screens;
    console.log(`   ✅ ${theatreData.name} (${theatreData.city}) - ${screens.length} screens`);
  }

  // ── 5. Fetch active movies ──────────────────────────────────────────────────
  const movies = await db.collection("movies_new").find({ isActive: true }).toArray();
  console.log(`\n🎬 Found ${movies.length} active movies`);

  if (movies.length === 0) {
    console.log("⚠️  No movies found. Run seedRealisticMovies.js first.");
    await mongoose.disconnect();
    return;
  }

  // ── 6. Create shows for each theatre ────────────────────────────────────────
  console.log("\n📅 Creating shows...");
  
  const theatres = await db.collection("theatres").find({}).toArray();
  let totalShows = 0;
  
  for (const theatre of theatres) {
    const tId = theatre._id.toString();
    const screens = screensByTheatre[tId] || [];
    if (screens.length === 0) continue;

    // Assign 4-5 movies per theatre (cycling through all movies)
    const theatreIdx = theatres.indexOf(theatre);
    const moviesPerTheatre = Math.min(5, movies.length);
    const selectedMovies = [];
    
    for (let i = 0; i < moviesPerTheatre; i++) {
      selectedMovies.push(movies[(theatreIdx * moviesPerTheatre + i) % movies.length]);
    }

    for (let mi = 0; mi < selectedMovies.length; mi++) {
      const movie = selectedMovies[mi];
      const screen = screens[mi % screens.length];

      // Create shows over next 14 days
      const daysToSchedule = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14];
      const slots = [SHOW_SLOTS[0], SHOW_SLOTS[2], SHOW_SLOTS[3]]; // Morning, Evening, Night

      for (const day of daysToSchedule) {
        for (const slot of slots) {
          const showDateTime = buildShowDateTime(day, slot.h, slot.m);
          // Skip past times for today
          if (showDateTime < new Date()) continue;

          const showDoc = {
            _id: new mongoose.Types.ObjectId(),
            movie: movie._id,
            theatre: theatre._id,
            screen: screen._id,
            showDateTime,
            basePrice: screen.seatTiers?.[0]?.price || 150,
            seatTiers: screen.seatTiers?.map(t => ({ ...t })) || [{ name: "Silver", price: 150, color: "#6B7280" }],
            totalCapacity: screen.totalSeats || 100,
            status: "available",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          await db.collection("shows_new").insertOne(showDoc);
          totalShows++;
        }
      }
    }
    
    console.log(`   ✅ ${theatre.name} - ${selectedMovies.length} movies scheduled`);
  }

  // ── 7. Summary ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seeding Complete!");
  console.log("────────────────────────────────────────");
  
  const finalTheatres = await db.collection("theatres").countDocuments();
  const finalScreens = await db.collection("screens_new").countDocuments();
  const finalShows = await db.collection("shows_new").countDocuments();
  const finalMovies = await db.collection("movies_new").countDocuments({ isActive: true });
  
  console.log(`📊 Final Counts:`);
  console.log(`   Theatres: ${finalTheatres}`);
  console.log(`   Screens:  ${finalScreens}`);
  console.log(`   Shows:    ${finalShows}`);
  console.log(`   Movies:   ${finalMovies}`);
  
  console.log("\n📍 Cities Covered:");
  const cities = [...new Set(REALISTIC_THEATRES.map(t => t.city))];
  cities.forEach(city => {
    const count = REALISTIC_THEATRES.filter(t => t.city === city).length;
    console.log(`   ${city}: ${count} theatres`);
  });

  await mongoose.disconnect();
  console.log("\n✅ Disconnected from MongoDB");
}

run().catch(e => { console.error(e); process.exit(1); });
