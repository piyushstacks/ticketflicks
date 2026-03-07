/**
 * fix_users_data.mjs — run from server/ directory
 * 1. Update placeholder phone numbers → random realistic Indian mobile numbers.
 * 2. Link each manager (managedTheatreId=null) to their theatre by name-matching.
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Script lives in server/ — .env is in the same folder
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error("❌ MONGODB_URI not found in .env"); process.exit(1); }

function randomIndianPhone() {
    const first = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
    let num = String(first);
    for (let i = 0; i < 9; i++) num += Math.floor(Math.random() * 10);
    return num;
}

const client = new MongoClient(MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false });

try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("ticketflicks");
    const users = db.collection("users_new");
    const theatres = db.collection("theatres");

    // ── 1. Fix placeholder phones ─────────────────────────────────────────────
    console.log("\n📞 Step 1: Fixing placeholder phone numbers...");
    const badPhones = await users
        .find({ phone: { $in: ["0000000000", "9999999999", "1234567890", "1234567899"] } })
        .toArray();

    let phoneFixed = 0;
    for (const user of badPhones) {
        const newPhone = randomIndianPhone();
        await users.updateOne({ _id: user._id }, { $set: { phone: newPhone } });
        console.log(`  ✓ ${user.name} (${user.role}): ${user.phone} → ${newPhone}`);
        phoneFixed++;
    }
    console.log(`  → ${phoneFixed} phone numbers updated.`);

    // ── 2. Link unlinked managers → theatres ─────────────────────────────────
    console.log("\n🏛️  Step 2: Linking managers to theatres...");
    const unlinked = await users
        .find({ role: "manager", $or: [{ managedTheatreId: null }, { managedTheatreId: { $exists: false } }] })
        .toArray();

    const allTheatres = await theatres.find({}).toArray();
    console.log(`  Found ${unlinked.length} unlinked managers, ${allTheatres.length} theatres.`);

    let linked = 0;
    for (const mgr of unlinked) {
        const emailLocal = mgr.email.split("@")[0].replace(/^mgr\./, "").toLowerCase();
        let best = null, bestScore = 0;

        for (const t of allTheatres) {
            const tName = (t.name || "").toLowerCase().replace(/[\s\-_]/g, "");
            let score = 0;
            const maxLen = Math.min(emailLocal.length, tName.length);
            for (let len = maxLen; len >= 4; len--) {
                for (let s = 0; s <= emailLocal.length - len; s++) {
                    if (tName.includes(emailLocal.slice(s, s + len))) { score = len; break; }
                }
                if (score) break;
            }
            if (score > bestScore) { bestScore = score; best = t; }
        }

        if (best && bestScore >= 4) {
            await users.updateOne({ _id: mgr._id }, { $set: { managedTheatreId: best._id } });
            console.log(`  ✓ ${mgr.name} → "${best.name}" (match score: ${bestScore})`);
            linked++;
        } else {
            console.log(`  ⚠ ${mgr.name} (${emailLocal}) — no confident match (best: ${bestScore})`);
        }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Phone numbers fixed : ${phoneFixed}`);
    console.log(`   Managers linked     : ${linked}`);
} catch (err) {
    console.error("❌ Error:", err.message);
} finally {
    await client.close();
}
