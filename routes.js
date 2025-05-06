// routes.js
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcryptjs");

// ----------------------
// Required Modules for Backup & Restore
// ----------------------
const mysqldump = require("mysqldump");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process"); // For restore command

// --------------------
// GENERAL APPLICATION ROUTES (Members, Login, etc.)
// --------------------

// GET member count
router.get('/member-count', (req, res) => {
  const query = 'SELECT COUNT(*) AS count FROM tbl_members';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ count: results[0].count });
  });
});

// ADD MEMBER
router.post("/add-member", (req, res) => {
  const { full_name, role, contact_info, gender, birthday } = req.body;
  const qrData = `${full_name}-${Date.now()}`;
  const query = `
    INSERT INTO tbl_members (full_name, role, contact_info, gender, birthday, qr_code_data)
    VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(query, [full_name, role, contact_info, gender, birthday, qrData], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ message: "Member added successfully", qrData });
  });
});

// UPDATE MEMBER
router.put("/update-member/:id", (req, res) => {
  const { full_name, role, contact_info, gender, birthday } = req.body;
  const memberId = req.params.id;
  const query = `
    UPDATE tbl_members
    SET full_name = ?, role = ?, contact_info = ?, gender = ?, birthday = ?
    WHERE member_id = ?`;
  db.query(query, [full_name, role, contact_info, gender, birthday, memberId], (err) => {
    if (err) return res.status(500).json({ message: "Update failed", error: err });
    res.json({ message: "Member updated successfully" });
  });
});

// GET ALL MEMBERS
router.get("/members", (req, res) => {
  db.query("SELECT * FROM tbl_members", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// DELETE MEMBER
router.delete("/delete-member/:id", (req, res) => {
  const memberId = req.params.id;
  const query = `DELETE FROM tbl_members WHERE member_id = ?`;
  db.query(query, [memberId], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed", error: err });
    res.json({ message: "Member deleted successfully" });
  });
});

// GET counts of members by role (Dashboard counts)
router.get('/dashboard-counts', (req, res) => {
  const query = `
    SELECT role, COUNT(*) as count
    FROM tbl_members
    GROUP BY role
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching counts' });
    
    // Build counts object, e.g., { Deacon: 5, Choir: 8, Secretary: 3, Finance: 2 }
    const counts = {};
    results.forEach(row => {
      counts[row.role] = row.count;
    });
    
    res.json(counts);
  });
});

// ----------------------
// SECURITY FEATURES
// ----------------------

// Admin Login Route
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const storedHash = results[0].password;
    const isValid = await bcrypt.compare(password, storedHash);
    if (isValid) {
      res.status(200).json({ message: "Login successful!" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

// ----------------------
// BACKUP FEATURES WITH GOOGLE DRIVE INTEGRATION
// ----------------------

// Database configuration for backup
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';  
const dbName = 'railway';
const dbPort = 16446;
const backupsFolder = path.join(__dirname, 'backups');

// Ensure the backups folder exists
if (!fs.existsSync(backupsFolder)) {
  fs.mkdirSync(backupsFolder, { recursive: true });
}

// Google Drive Setup: Authenticate using your service account key
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// Function to upload backup file to Google Drive
async function uploadBackupToGoogleDrive(backupPath, fileName) {
  const fileMetadata = {
    name: fileName,
    // Optionally, specify a Drive folder by adding:
    // parents: ['YOUR_FOLDER_ID'],
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
    console.log(`✅ Backup file uploaded to Google Drive with File ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Failed to upload backup to Google Drive: ${error.message}`);
    throw error;
  }
}

// Function to set file permissions to public and retrieve its public link(s)
async function getPublicLink(fileId) {
  try {
    // Set permission so anyone with the link can read the file
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
    // Retrieve the file metadata containing the public links
    const fileData = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink'
    });
    console.log(`✅ Public link set: ${fileData.data.webViewLink}`);
    return fileData.data;
  } catch (error) {
    console.error(`❌ Failed to set public link: ${error.message}`);
    throw error;
  }
}

// Backup Route: Create backup using mysqldump, upload to Google Drive,
// then set it to public and return the public link.
router.post("/backup", async (req, res) => {
  const now = new Date();
  // Generate base filename (e.g., backup_MMDDYYYY)
  const baseFileName = `backup_${(now.getMonth() + 1)
    .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;
  // Count existing backups for today's date
  const existingBackups = fs.readdirSync(backupsFolder).filter(file => file.startsWith(baseFileName)).length;
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
    console.log(`✅ Backup successfully created at: ${backupPath}`);
    
    // Upload the backup file to Google Drive
    const driveFileId = await uploadBackupToGoogleDrive(backupPath, fileName);
    // Set the file permission to public and retrieve its public link(s)
    const publicLinks = await getPublicLink(driveFileId);
    
    res.status(200).json({ 
      message: "Backup successful", 
      backupFile: fileName, 
      googleDriveFileId: driveFileId,
      publicLink: publicLinks.webViewLink
    });
  } catch (error) {
    console.error(`❌ Error creating backup: ${error.message}`);
    res.status(500).json({ error: "Backup failed", details: error.message });
  }
});

// Restore Route (Using the mysql client; ensure 'mysql' is available in your environment)
router.post("/restore", (req, res) => {
  const { backupFile } = req.body; // Expected: "backup_MMDDYYYY_1.sql"
  if (!backupFile) {
    return res.status(400).json({ error: "Please provide a backup file name." });
  }
  
  const backupPath = path.join(backupsFolder, backupFile);
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }
  
  // Build the restore command (assuming the mysql client is available)
  const restoreCommand = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} < "${backupPath}"`;
  console.log("📥 Running restore command:", restoreCommand);
  
  exec(restoreCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Restore failed!");
      console.error("Error message:", error.message);
      console.error("StdErr:", stderr);
      return res.status(500).json({ error: "Restore failed", details: error.message });
    }
    console.log("✅ Restore successful from:", backupPath);
    res.status(200).json({ message: "Restore successful", restoredFrom: backupFile });
  });
});

module.exports = router;
