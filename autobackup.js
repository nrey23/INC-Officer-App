// autobackup.js
const mysqldump = require("mysqldump");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");

// Database configuration
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbPort = process.env.DB_PORT;

// Google Drive Setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

async function uploadBackupToGoogleDrive(backupPath, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
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

async function createAutoBackup() {
  const now = new Date();
  const baseFileName = `autobackup_${(now.getMonth() + 1)
    .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;
  const fileName = `${baseFileName}.sql`;
  const backupPath = path.join(__dirname, 'backups', fileName);

  try {
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
    await uploadBackupToGoogleDrive(backupPath, fileName);
    return fileName;
  } catch (error) {
    console.error(`❌ Autobackup failed: ${error.message}`);
    throw error;
  }
}

// Schedule autobackup every 3 days at midnight
cron.schedule('0 0 */3 * *', createAutoBackup, {
  scheduled: true,
  timezone: "Asia/Manila",
});

module.exports = { createAutoBackup }; 