// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cron = require('node-cron'); // 🔄 Scheduling backups
const path = require('path');
const fs = require('fs');
const mysqldump = require('mysqldump'); // ✅ Node.js-based backup
const { google } = require('googleapis'); // Google Drive integration

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files using an absolute path
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routes);

// Serve the login.html file at the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Bind the server to the correct Railway-assigned port:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT} (process.env.PORT=${process.env.PORT})`)
);

// ------------------------------------------------------
// Auto-Backup Setup (Runs Every 3 Days at Midnight)

// Database configuration
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';
const dbName = 'railway';
const dbPort = 16446;

// Backups folder configuration
const backupsFolder = path.join(__dirname, 'backups');
// Ensure backups folder exists
if (!fs.existsSync(backupsFolder)) {
  fs.mkdirSync(backupsFolder, { recursive: true });
}

// Google Drive Setup: Authenticate using your service account key
const auth = new google.auth.GoogleAuth({
  keyFile: '"C:\Users\nrlic\OneDrive\Documents\church-duty-tracker\ccc151-final-project-61aafd39d145.json"', // <-- UPDATE this with your JSON key path
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// Function to upload a backup file to Google Drive
async function uploadBackupToGoogleDrive(backupPath, fileName) {
  const fileMetadata = {
    name: fileName,
    // Uncomment and set your folder ID to upload to a specific folder in Drive:
    // parents: ['YOUR_FOLDER_ID'],
  };

  const media = {
    mimeType: 'application/sql',
    body: fs.createReadStream(backupPath),
  };

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name',
    });
    console.log(`✅ Backup uploaded to Google Drive. File ID: ${res.data.id}`);
  } catch (error) {
    console.error(`❌ Failed to upload backup to Google Drive: ${error.message}`);
  }
}

// Function to generate a backup using mysqldump and upload it to Google Drive
async function createBackup() {
  console.log("⏳ Running automated backup...");

  const now = new Date();
  const baseFileName = `autobackup_${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;
  const existingBackups = fs
    .readdirSync(backupsFolder)
    .filter((file) => file.startsWith(baseFileName)).length;
  const backupNumber = existingBackups + 1;
  const fileName = `${baseFileName}_${backupNumber}.sql`;
  const backupPath = path.join(backupsFolder, fileName);

  try {
    // Create the backup file using the mysqldump Node.js package
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
    console.log(`✅ Auto-backup successfully created at: ${backupPath}`);

    // Upload the newly created backup to Google Drive
    await uploadBackupToGoogleDrive(backupPath, fileName);
  } catch (error) {
    console.error(`❌ Auto-backup failed: ${error.message}`);
  }
}

// Schedule automatic backups every 3 days at midnight (Asia/Manila timezone)
cron.schedule(
  '0 0 */3 * *',
  createBackup,
  {
    scheduled: true,
    timezone: "Asia/Manila", // Adjust as needed
  }
);
