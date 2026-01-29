import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';

async function checkTheatre() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');
    
    const theatre = await Theatre.findById('697b7e398e1404979c6db9f9');
    console.log('Test theatre details:');
    console.log('Name:', theatre.name);
    console.log('Approval status:', theatre.approval_status);
    console.log('Disabled:', theatre.disabled);
    console.log('Manager ID:', theatre.manager_id);
    
    // Check the exact query from publicScreenTblController
    const theatreCheck = await Theatre.findOne({ 
      _id: new mongoose.Types.ObjectId('697b7e398e1404979c6db9f9'),
      approval_status: 'approved'
    });
    
    console.log('Theatre check result:', theatreCheck ? 'Found' : 'Not found');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkTheatre();