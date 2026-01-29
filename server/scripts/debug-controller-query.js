import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';

async function debugControllerQuery() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');
    
    const theatreId = '697b7e398e1404979c6db9f9';
    console.log('Testing controller query logic...');
    console.log('Theatre ID from params:', theatreId);
    
    // Test the exact query from the controller
    console.log('\n--- Testing controller query ---');
    const theatre1 = await Theatre.findOne({ 
      _id: new mongoose.Types.ObjectId(theatreId),
      approval_status: 'approved'
    });
    console.log('Controller query result:', theatre1 ? 'Found' : 'Not found');
    
    // Test with string ID directly
    console.log('\n--- Testing with string ID ---');
    const theatre2 = await Theatre.findOne({ 
      _id: theatreId,
      approval_status: 'approved'
    });
    console.log('String ID query result:', theatre2 ? 'Found' : 'Not found');
    
    // Test ObjectId creation
    console.log('\n--- Testing ObjectId creation ---');
    try {
      const objectId = new mongoose.Types.ObjectId(theatreId);
      console.log('ObjectId created successfully:', objectId);
      console.log('ObjectId toString:', objectId.toString());
    } catch (error) {
      console.log('ObjectId creation failed:', error.message);
    }
    
    // Test findById
    console.log('\n--- Testing findById ---');
    const theatre3 = await Theatre.findById(theatreId);
    console.log('findById result:', theatre3 ? 'Found' : 'Not found');
    if (theatre3) {
      console.log('Theatre name:', theatre3.name);
      console.log('Approval status:', theatre3.approval_status);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugControllerQuery();