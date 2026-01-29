#!/usr/bin/env node

/**
 * Debug script for public endpoint issue
 * Usage: node debug-public-endpoint.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import ScreenTbl from '../models/ScreenTbl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const theatreId = '6977b996c8b0e06f15428e7a';

async function debugPublicEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n🔍 Debugging theatre ID: ${theatreId}`);
    
    // Check if theatre exists
    const theatre = await Theatre.findById(theatreId);
    console.log('Theatre found by ID:', theatre ? 'YES' : 'NO');
    
    if (theatre) {
      console.log(`Theatre details:`);
      console.log(`  Name: ${theatre.name}`);
      console.log(`  Approval status: ${theatre.approval_status}`);
      console.log(`  Disabled: ${theatre.disabled}`);
      console.log(`  Manager ID: ${theatre.manager_id}`);
    }
    
    // Check with approval_status filter
    const theatreWithFilters = await Theatre.findOne({ 
      _id: theatreId,
      approval_status: 'approved',
      disabled: false
    });
    console.log('\nTheatre found with filters:', theatreWithFilters ? 'YES' : 'NO');
    
    // Check screens
    const screens = await ScreenTbl.find({ theatre: theatreId });
    console.log(`\nScreens found: ${screens.length}`);
    
    // Check active screens
    const activeScreens = await ScreenTbl.find({ 
      theatre: theatreId,
      isActive: true,
      status: 'active'
    });
    console.log(`Active screens: ${activeScreens.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugPublicEndpoint();