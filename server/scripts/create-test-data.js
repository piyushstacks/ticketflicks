import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import User from '../models/User.js';

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');
    
    // Create a test manager
    let manager = await User.findOne({ email: 'test@manager.com' });
    if (!manager) {
      manager = new User({
        name: 'Test Manager',
        email: 'test@manager.com',
        password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // bcrypt hash for 'password'
        phone: '1234567890',
        role: 'manager'
      });
      await manager.save();
      console.log('Created test manager:', manager._id.toString());
    } else {
      console.log('Found existing manager:', manager._id.toString());
    }
    
    // Create a test theatre with screens
    const theatre = new Theatre({
      name: 'Test Theatre',
      location: 'Test Location',
      manager_id: manager._id,
      approval_status: 'approved',
      screens: [
        {
          name: 'Screen 1',
          layout: {
            name: 'Standard Layout',
            rows: 2,
            seatsPerRow: 3,
            totalSeats: 6,
            layout: [['A1', 'A2', 'A3'], ['B1', 'B2', 'B3']]
          },
          pricing: {
            Regular: 150,
            Premium: 250
          },
          totalSeats: 6,
          status: 'active'
        },
        {
          name: 'Screen 2',
          layout: {
            name: 'Small Layout',
            rows: 3,
            seatsPerRow: 2,
            totalSeats: 6,
            layout: [['A1', 'A2'], ['B1', 'B2'], ['C1', 'C2']]
          },
          pricing: {
            Regular: 120
          },
          totalSeats: 6,
          status: 'active'
        }
      ]
    });
    
    await theatre.save();
    console.log('Created test theatre:', theatre._id.toString());
    console.log('Theatre screens:', theatre.screens.length);
    
    // Update manager with theatre
    manager.managedTheatreId = theatre._id;
    await manager.save();
    
    console.log('Test data created successfully!');
    console.log('Theatre ID:', theatre._id.toString());
    console.log('Manager ID:', manager._id.toString());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestData();