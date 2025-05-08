// routes.js
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcryptjs");
const mysql = require('mysql2/promise');
const { createAutoBackup } = require('./autobackup');
const session = require('express-session');

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

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// ADD MEMBER (unprotected)
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

// Admin Login Route (no rate limit)
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const storedHash = results[0].password;
    const isValid = await bcrypt.compare(password, storedHash);
    if (isValid) {
      req.session.isLoggedIn = true;
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

// Function to create backup and return it as a buffer
async function createBackupBuffer() {
  const result = await mysqldump({
    connection: {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    }
  });
  return Buffer.from(result.dump.schema + '\n' + result.dump.data, 'utf-8');
}

// Manual Backup Route: Returns backup file for download (protected)
router.post("/manual-backup", requireAuth, async (req, res) => {
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

// Restore Route: Now accepts file upload instead of looking for local file (protected)
router.post("/restore", requireAuth, async (req, res) => {
  if (!req.files || !req.files.backupFile) {
    return res.status(400).json({ error: "Please upload a backup file." });
  }

  const backupFile = req.files.backupFile;
  // Add drop table statements before the SQL dump
  const dropTables = `
    SET FOREIGN_KEY_CHECKS=0;
    DROP TABLE IF EXISTS tbl_members;
    DROP TABLE IF EXISTS users;
    SET FOREIGN_KEY_CHECKS=1;
  `;
  const sql = dropTables + '\n' + backupFile.data.toString();

  try {
    const connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true,
    });

    await connection.query(sql);
    await connection.end();

    res.status(200).json({ message: "Restore successful" });
  } catch (error) {
    console.error("❌ Restore failed!", error);
    res.status(500).json({ error: "Restore failed", details: error.message });
  }
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

// Auto Backup Route: Calls the same logic as autobackup.js (protected)
router.post("/auto-backup", requireAuth, async (req, res) => {
  try {
    const backupFile = await createAutoBackup();
    res.status(200).json({
      message: "Auto backup successful!",
      backupFile,
      driveFolder: "https://drive.google.com/drive/folders/1VGNvQ6EUdvMj4IrOaGZo2PYX5Zb8FQCs"
    });
  } catch (error) {
    console.error(`❌ Error creating auto backup: ${error.message}`);
    res.status(500).json({ error: "Auto backup failed", details: error.message });
  }
});

module.exports = router;
