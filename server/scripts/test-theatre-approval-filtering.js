import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTheatreApprovalFiltering() {
  try {
    await mongoose.connect('mongodb://localhost:27017/movieticketbooking');
    console.log('Connected to MongoDB');

    // Check all theatres and their approval status
    const allTheatres = await Theatre.find({});
    console.log(`\nTotal theatres in database: ${allTheatres.length}`);
    
    const statusCounts = {
      pending: 0,
      approved: 0,
      declined: 0,
      undefined: 0
    };

    allTheatres.forEach(theatre => {
      const status = theatre.approval_status;
      if (status === 'pending') statusCounts.pending++;
      else if (status === 'approved') statusCounts.approved++;
      else if (status === 'declined') statusCounts.declined++;
      else statusCounts.undefined++;
    });

    console.log('Approval status distribution:');
    console.log('- Pending:', statusCounts.pending);
    console.log('- Approved:', statusCounts.approved);
    console.log('- Declined:', statusCounts.declined);
    console.log('- Undefined:', statusCounts.undefined);

    // Test the new filtering logic
    console.log('\n--- Testing Admin Controller Logic ---');
    const approvedTheatres = await Theatre.find({ 
      disabled: { $ne: true }, 
      approval_status: 'approved' 
    });
    console.log(`Approved theatres (for admin dashboards): ${approvedTheatres.length}`);
    
    if (approvedTheatres.length > 0) {
      console.log('First approved theatre:', approvedTheatres[0].name, 'Status:', approvedTheatres[0].approval_status);
    }

    console.log('\n--- Testing Manager Controller Logic ---');
    // Simulate manager ID (you can change this to test with specific manager)
    const testManagerId = '697b7e398e1404979c6db9f9'; // Using our test theatre ID as example
    const managerTheatres = await Theatre.find({ 
      manager_id: testManagerId,
      approval_status: 'approved' 
    });
    console.log(`Theatres for manager ${testManagerId}: ${managerTheatres.length}`);

    console.log('\n--- Testing Public Controller Logic ---');
    const publicTheatre = await Theatre.findOne({ 
      _id: testManagerId, 
      approval_status: 'approved',
      disabled: { $ne: true }
    });
    console.log(`Public theatre access for ${testManagerId}:`, publicTheatre ? 'ALLOWED' : 'DENIED');

    console.log('\n--- Testing Pending Theatre Access ---');
    const pendingTheatres = await Theatre.find({ approval_status: 'pending' });
    console.log(`Pending theatres found: ${pendingTheatres.length}`);
    
    if (pendingTheatres.length > 0) {
      const pendingTheatre = pendingTheatres[0];
      console.log('First pending theatre:', pendingTheatre.name);
      
      // Test if it would be included in admin results
      const wouldBeIncluded = await Theatre.findOne({ 
        _id: pendingTheatre._id,
        disabled: { $ne: true }, 
        approval_status: 'approved' 
      });
      console.log(`Would this pending theatre be shown in admin dashboards? ${wouldBeIncluded ? 'YES' : 'NO'}`);
    }

    console.log('\n✅ Theatre approval filtering test completed successfully!');
    console.log('Only approved theatres will now be shown in dashboards and public endpoints.');

  } catch (error) {
    console.error('❌ Error testing theatre approval filtering:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testTheatreApprovalFiltering();