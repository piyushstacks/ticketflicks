#!/usr/bin/env node

/**
 * Test script for SCREEN_TBL endpoints
 * Usage: node test-screen-tbl.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

// Test data
const testManagerToken = process.env.MANAGER_TEST_TOKEN;
const testTheatreId = process.env.TEST_THEATRE_ID;

async function testManagerEndpoints() {
  console.log('🧪 Testing SCREEN_TBL manager endpoints...');
  
  if (!testManagerToken) {
    console.log('⚠️  No manager test token provided. Skipping authenticated tests.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${testManagerToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Get screens for manager's theatre
    console.log('\n📋 Test 1: Getting screens for manager theatre...');
    const getScreensResponse = await axios.get(`${API_BASE}/manager/screens-tbl`, { headers });
    console.log('✅ Get screens response:', getScreensResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (getScreensResponse.data.success) {
      console.log(`   Found ${getScreensResponse.data.screens.length} screens`);
    }

    // Test 2: Add a new screen
    console.log('\n➕ Test 2: Adding new screen...');
    const newScreenData = {
      name: 'Screen 3',
      screenNumber: '3',
      seatLayout: {
        layout: [
          ['A1', 'A2', 'A3', 'A4', 'A5'],
          ['B1', 'B2', 'B3', 'B4', 'B5'],
          ['C1', 'C2', 'C3', 'C4', 'C5']
        ],
        rows: 3,
        seatsPerRow: 5,
        totalSeats: 15
      },
      seatTiers: [
        {
          tierName: 'Regular',
          price: 150,
          rows: ['B', 'C']
        },
        {
          tierName: 'Premium',
          price: 200,
          rows: ['A']
        }
      ],
      status: 'active'
    };

    const addScreenResponse = await axios.post(`${API_BASE}/manager/screens-tbl/add`, newScreenData, { headers });
    console.log('✅ Add screen response:', addScreenResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (addScreenResponse.data.success) {
      console.log(`   Added screen ID: ${addScreenResponse.data.screen._id}`);
    }

    // Test 3: Toggle screen status
    if (addScreenResponse.data.success && addScreenResponse.data.screen) {
      const newScreenId = addScreenResponse.data.screen._id;
      console.log('\n🔄 Test 3: Toggling screen status...');
      const toggleResponse = await axios.patch(
        `${API_BASE}/manager/screens-tbl/${newScreenId}/toggle`,
        { status: 'inactive' },
        { headers }
      );
      console.log('✅ Toggle screen response:', toggleResponse.data.success ? 'SUCCESS' : 'FAILED');
    }

    console.log('\n🎉 Manager endpoint tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function testPublicEndpoints() {
  console.log('\n🌐 Testing SCREEN_TBL public endpoints...');
  
  if (!testTheatreId) {
    console.log('⚠️  No test theatre ID provided. Skipping public tests.');
    return;
  }

  try {
    // Test 1: Get screens by theatre
    console.log('\n📋 Test 1: Getting screens by theatre...');
    const getScreensResponse = await axios.get(`${API_BASE}/public/screens/theatre/${testTheatreId}`);
    console.log('✅ Get screens response:', getScreensResponse.data.success ? 'SUCCESS' : 'FAILED');
    if (getScreensResponse.data.success) {
      console.log(`   Found ${getScreensResponse.data.screens.length} screens`);
    }

    console.log('\n🎉 Public endpoint tests completed!');

  } catch (error) {
    console.error('❌ Public test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting SCREEN_TBL endpoint tests...');
  console.log('📍 API Base:', API_BASE);
  
  await testManagerEndpoints();
  await testPublicEndpoints();
  
  console.log('\n✅ All tests completed!');
}

// Execute tests
runTests().catch(console.error);