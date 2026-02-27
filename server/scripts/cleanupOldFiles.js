import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = (msg) => console.log(`[CLEANUP] ${msg}`);
const error = (msg, err) => console.error(`[CLEANUP ERROR] ${msg}`, err);

// Files to remove as they've been consolidated
const filesToRemove = [
  // Old duplicate model files (replaced with consolidated versions)
  "../models/User_new.js",
  "../models/Booking_new.js",
  "../models/Movie_new.js",
  "../models/Screen_new.js",
  "../models/Show_new.js",
  "../models/Theater_new.js",
  
  // Old controller duplicates (if they exist)
  "../controllers/bookingController_new.js",
  "../controllers/movieController_new.js",
  "../controllers/showController_new.js",
  "../controllers/screenController_new.js",
  "../controllers/theatreController_new.js",
  "../controllers/userController_new.js",
  "../controllers/seatController_new.js",
  "../controllers/metadataController_new.js",
  "../controllers/reviewPaymentController_new.js",
  "../controllers/searchController_new.js",
  "../controllers/authController.old.js",
  
  // Old route files (if separate ones exist)
  // These would only be removed if using consolidated routes
];

const archiveToDirectory = "../archive";

const cleanup = async () => {
  try {
    log("========================================");
    log("STARTING CLEANUP OF OLD/DUPLICATE FILES");
    log("========================================");
    
    // Create archive directory if it doesn't exist
    const archiveDir = path.resolve(__dirname, archiveToDirectory);
    
    if (!fs.existsSync(archiveDir)) {
      log(`Creating archive directory: ${archiveDir}`);
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    let removedCount = 0;
    let archivedCount = 0;
    
    for (const fileRelPath of filesToRemove) {
      const filePath = path.resolve(__dirname, fileRelPath);
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        const fileName = path.basename(filePath);
        const archivePath = path.join(archiveDir, fileName);
        
        try {
          // Copy file to archive before removal
          fs.copyFileSync(filePath, archivePath);
          log(`✓ Archived: ${fileName} → ${archiveDir}`);
          archivedCount++;
          
          // Remove original file
          fs.unlinkSync(filePath);
          log(`✓ Removed: ${fileName}`);
          removedCount++;
        } catch (err) {
          error(`Failed to process ${fileName}`, err.message);
        }
      } else {
        log(`- File not found (skipped): ${fileRelPath}`);
      }
    }
    
    log("========================================");
    log("CLEANUP SUMMARY");
    log(`Archived: ${archivedCount} files`);
    log(`Removed: ${removedCount} files`);
    log("Archive location: " + archiveDir);
    log("========================================");
    log("✅ Cleanup completed successfully!");
    
  } catch (err) {
    error("Cleanup script failed", err.message);
    process.exit(1);
  }
};

// Ask for confirmation before deleting
const confirmCleanup = async () => {
  if (process.argv[2] === "--force") {
    await cleanup();
  } else {
    log("To confirm cleanup and remove old files, run:");
    log("  node cleanupOldFiles.js --force");
    log("");
    log("This will:");
    log("  1. Archive old files to /server/archive/");
    log("  2. Remove old duplicate model and controller files");
    log("  3. Keep consolidated unified files");
    log("");
    log("Make sure you have a database backup before proceeding!");
    process.exit(0);
  }
};

confirmCleanup();
