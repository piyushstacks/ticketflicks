#!/usr/bin/env node

/**
 * Migration script to move screens from Theatre model to SCREEN_TBL
 * Usage: node migrate-screens.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Import the migration function
import migrateScreensToScreenTbl from './migrateScreensToScreenTbl.js';

console.log('🚀 Starting SCREEN_TBL migration...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');

// Run the migration
migrateScreensToScreenTbl()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });