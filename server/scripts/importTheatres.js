import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
const Theatre = mongoose.model('Theatre', new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contact_no: { type: String, required: false },
    approval_status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
    approval_date: { type: Date },
    screens: { type: Array, default: [] }
}, { timestamps: true }));

const User = mongoose.model('User', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin", "manager", "pending_manager"], default: "customer" }
}, { collection: 'user_tbls' }));

// Dummy theatres data from assets
const dummyTheatresData = [
    { "id": 1, "name": "PVR Cinemas - Downtown", "location": "Downtown Mall, Main Street", "distance": "2.5 km" },
    { "id": 2, "name": "IMAX Theatre - Central", "location": "Central Plaza, Highway 1", "distance": "5.2 km" },
    { "id": 3, "name": "Cineplex - Westside", "location": "Westside Shopping Center", "distance": "7.8 km" },
    { "id": 4, "name": "Carnival Cinemas - Eastside", "location": "Eastside Plaza", "distance": "3.4 km" }
];

// Sample screen layouts for theatres
const sampleScreens = [
    {
        name: "Screen 1",
        layout: {
            name: "Standard Layout",
            rows: 10,
            seatsPerRow: 15,
            totalSeats: 150,
            layout: [
                ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15"],
                ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12", "B13", "B14", "B15"],
                ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C15"],
                ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "D14", "D15"],
                ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15"],
                ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15"],
                ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12", "G13", "G14", "G15"],
                ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12", "H13", "H14", "H15"],
                ["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8", "I9", "I10", "I11", "I12", "I13", "I14", "I15"],
                ["J1", "J2", "J3", "J4", "J5", "J6", "J7", "J8", "J9", "J10", "J11", "J12", "J13", "J14", "J15"]
            ]
        },
        pricing: {
            standard: 150,
            premium: 200,
            vip: 250
        },
        totalSeats: 150,
        status: 'active'
    },
    {
        name: "Screen 2",
        layout: {
            name: "Premium Layout",
            rows: 8,
            seatsPerRow: 12,
            totalSeats: 96,
            layout: [
                ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12"],
                ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9", "B10", "B11", "B12"],
                ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12"],
                ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12"],
                ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12"],
                ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"],
                ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"],
                ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12"]
            ]
        },
        pricing: {
            standard: 200,
            premium: 250,
            vip: 300
        },
        totalSeats: 96,
        status: 'active'
    }
];

async function importTheatres() {
    try {
        // Check if MongoDB URI is available
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in the environment variables');
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find an existing admin user to be the manager
        let managerId;
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
            console.log('No admin user found. Creating theatres with a temporary manager...');
            // Create a temporary manager user
            const tempManager = new User({
                name: 'Theatre Manager',
                email: 'manager@ticketflicks.com',
                phone: '1234567890',
                password_hash: 'temp_password_hash',
                role: 'manager'
            });
            await tempManager.save();
            managerId = tempManager._id;
            console.log('Created temporary manager user');
        } else {
            managerId = adminUser._id;
            console.log(`Using existing admin user: ${adminUser.name}`);
        }

        // Clear existing theatres (optional)
        const clearExisting = process.argv.includes('--clear');
        if (clearExisting) {
            await Theatre.deleteMany({});
            console.log('Cleared existing theatres');
        }

        // Transform and import theatres
        const theatresToImport = dummyTheatresData.map((theatre, index) => ({
            name: theatre.name,
            location: theatre.location,
            manager_id: managerId,
            contact_no: `+91${9876543210 + index}`, // Generate unique contact numbers
            approval_status: 'approved', // Auto-approve dummy theatres
            approval_date: new Date(),
            screens: sampleScreens
        }));

        // Insert theatres
        const result = await Theatre.insertMany(theatresToImport);
        console.log(`Successfully imported ${result.length} theatres`);

        // Update manager's managedTheatreId with the first theatre
        if (result.length > 0) {
            await User.findByIdAndUpdate(managerId, { managedTheatreId: result[0]._id });
            console.log(`Updated manager's managedTheatreId to ${result[0]._id}`);
        }

    } catch (error) {
        console.error('Error importing theatres:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the import
importTheatres();