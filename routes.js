// routes.js
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcryptjs");
const fileUpload = require('express-fileupload');

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

// Google Drive Setup: Authenticate using your service account key
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// Function to create backup and return it as a buffer
async function createBackupBuffer() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    mysqldump({
      connection: {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      },
      dump: {
        data: true,
        schema: true,
      },
      stream: true,
    })
    .on('data', chunk => chunks.push(chunk))
    .on('end', () => resolve(Buffer.concat(chunks)))
    .on('error', err => reject(err));
  });
}

// Function to upload backup buffer to Google Drive
async function uploadBackupToGoogleDrive(backupBuffer, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: ['1VGNvQ6EUdvMj4IrOaGZo2PYX5Zb8FQCs'],
  };
  const media = {
    mimeType: 'application/sql',
    body: backupBuffer,
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

// Auto Backup Route: Creates backup and uploads directly to Google Drive
router.post("/auto-backup", async (req, res) => {
  const now = new Date();
  const fileName = `auto_backup_${(now.getMonth() + 1)
    .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}.sql`;
  
  try {
    // Create backup buffer
    const backupBuffer = await createBackupBuffer();
    
    // Upload to Google Drive
    const driveFileId = await uploadBackupToGoogleDrive(backupBuffer, fileName);
    const publicLinks = await getPublicLink(driveFileId);
    
    res.status(200).json({ 
      message: "Auto backup successful", 
      backupFile: fileName, 
      googleDriveFileId: driveFileId,
      publicLink: publicLinks.webViewLink
    });
  } catch (error) {
    console.error(`❌ Error creating auto backup: ${error.message}`);
    res.status(500).json({ error: "Auto backup failed", details: error.message });
  }
});

// Manual Backup Route: Returns backup file for download
router.post("/manual-backup", async (req, res) => {
  const now = new Date();
  const fileName = `manual_backup_${(now.getMonth() + 1)
    .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}.sql`;
  
  try {
    // Create backup buffer
    const backupBuffer = await createBackupBuffer();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // Send the file
    res.send(backupBuffer);
  } catch (error) {
    console.error(`❌ Error creating manual backup: ${error.message}`);
    res.status(500).json({ error: "Manual backup failed", details: error.message });
  }
});

// Restore Route: Now accepts file upload instead of looking for local file
router.post("/restore", async (req, res) => {
  if (!req.files || !req.files.backupFile) {
    return res.status(400).json({ error: "Please upload a backup file." });
  }
  
  const backupFile = req.files.backupFile;
  const backupBuffer = backupFile.data;
  
  // Build the restore command using the buffer
  const restoreCommand = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName}`;
  
  const mysqlProcess = exec(restoreCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Restore failed!");
      console.error("Error message:", error.message);
      console.error("StdErr:", stderr);
      return res.status(500).json({ error: "Restore failed", details: error.message });
    }
    console.log("✅ Restore successful");
    res.status(200).json({ message: "Restore successful" });
  });
  
  // Write the backup buffer to the mysql process
  mysqlProcess.stdin.write(backupBuffer);
  mysqlProcess.stdin.end();
});

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

// Scheduled Backup Route (Called by Railway cron)
router.post("/scheduled-backup", async (req, res) => {
  // Verify the request is from Railway cron
  const cronSecret = process.env.CRON_SECRET;
  if (req.headers['x-cron-secret'] !== cronSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const fileName = `scheduled_backup_${(now.getMonth() + 1)
    .toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}.sql`;
  
  try {
    // Create backup buffer
    const backupBuffer = await createBackupBuffer();
    
    // Upload to Google Drive
    const driveFileId = await uploadBackupToGoogleDrive(backupBuffer, fileName);
    const publicLinks = await getPublicLink(driveFileId);
    
    console.log(`✅ Scheduled backup completed: ${fileName}`);
    console.log(`🔗 Backup link: ${publicLinks.webViewLink}`);
    
    res.status(200).json({ 
      message: "Scheduled backup successful", 
      backupFile: fileName, 
      googleDriveFileId: driveFileId,
      publicLink: publicLinks.webViewLink
    });
  } catch (error) {
    console.error(`❌ Error in scheduled backup: ${error.message}`);
    res.status(500).json({ error: "Scheduled backup failed", details: error.message });
  }
});

// Backup Status Route
router.get("/backup-status", async (req, res) => {
  try {
    // Get the last backup file from Google Drive
    const response = await drive.files.list({
      q: "name contains 'scheduled_backup_' and trashed = false",
      orderBy: 'createdTime desc',
      pageSize: 1,
      fields: 'files(id, name, createdTime, webViewLink)'
    });

    const lastBackup = response.data.files[0] || null;
    const now = new Date();
    
    // Calculate next backup time (3 days from last backup or now if no backup exists)
    const lastBackupDate = lastBackup ? new Date(lastBackup.createdTime) : new Date(0);
    const nextBackupDate = new Date(lastBackupDate);
    nextBackupDate.setDate(nextBackupDate.getDate() + 3);
    
    // If next backup is in the past, set it to 3 days from now
    if (nextBackupDate < now) {
      nextBackupDate.setDate(now.getDate() + 3);
    }

    // Calculate time remaining
    const timeRemaining = Math.ceil((nextBackupDate - now) / (1000 * 60 * 60 * 24));
    
    res.json({
      lastBackup: lastBackup ? {
        date: lastBackup.createdTime,
        fileName: lastBackup.name,
        link: lastBackup.webViewLink
      } : null,
      nextBackup: nextBackupDate.toISOString(),
      timeRemaining: `${timeRemaining} day${timeRemaining !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ error: "Failed to get backup status" });
  }
});

module.exports = router;
