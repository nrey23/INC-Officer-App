// Automatic Database Backup System
// This module handles scheduled database backups and uploads them to Google Drive
// Backups are created every 3 days and stored both locally and in the cloud

const mysqldump = require("mysqldump");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

// Database connection configuration for backup operations
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';
const dbName = 'railway';
const dbPort = 16446;

// Initialize Google Drive API authentication
// Uses service account credentials for automated access
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

/**
 * Uploads a backup file to Google Drive
 * @param {string} backupPath - Local path to the backup file
 * @param {string} fileName - Name to give the file in Google Drive
 * @returns {Promise<string>} The ID of the uploaded file in Google Drive
 */
async function uploadBackupToGoogleDrive(backupPath, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: ['1VGNvQ6EUdvMj4IrOaGZo2PYX5Zb8FQCs'], // Target folder ID in Google Drive
  };
  const media = {
    mimeType: 'application/sql',
    body: fs.createReadStream(backupPath),
  };
  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log(`✅ Autobackup uploaded to Google Drive. File ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Failed to upload autobackup: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a database backup and uploads it to Google Drive
 * Generates a filename based on the current date (MMDDYYYY.sql)
 * @returns {Promise<string>} The name of the created backup file
 */
async function createAutoBackup() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const baseFileName = `autobackup_${year}_${month}_${day}`;
  const fileName = `${baseFileName}.sql`;
  const backupsFolder = path.join(__dirname, 'backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupsFolder)) {
    fs.mkdirSync(backupsFolder, { recursive: true });
  }
  const backupPath = path.join(backupsFolder, fileName);

  try {
    // Create local database backup
    await mysqldump({
      connection: {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      },
      dumpToFile: backupPath,
    });
    console.log(`✅ Autobackup created at: ${backupPath}`);
    
    // Upload backup to Google Drive
    await uploadBackupToGoogleDrive(backupPath, fileName);
    return fileName;
  } catch (error) {
    console.error(`❌ Autobackup failed: ${error.message}`);
    throw error;
  }
}

// Schedule automatic backups to run every 3 days at midnight (Philippine time)
cron.schedule('0 0 */3 * *', createAutoBackup, {
  scheduled: true,
  timezone: "Asia/Manila",
});

// Export the backup function for manual backup creation if needed
module.exports = { createAutoBackup }; 