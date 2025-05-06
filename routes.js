// routes.js
const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcryptjs");

// For backup & restore features
const mysqldump = require("mysqldump");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// ----------------------
// MEMBER ROUTES
// ----------------------

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
    
    // Create an object like: { Deacon: 5, Choir: 8, Secretary: 3, Finance: 2 }
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

  // Query the database for the given username
  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Get the stored hashed password from the database
    const storedHash = results[0].password;
    
    // Compare the entered password with the stored hash
    const isValid = await bcrypt.compare(password, storedHash);

    if (isValid) {
      res.status(200).json({ message: "Login successful!" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

// ----------------------
// BACKUP FEATURES
// ----------------------

// Configuration for credentials and backup folder
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';  // Replace with your actual MySQL password
const dbName = 'railway'; // Use your correct database name
const dbPort = 16446;
const backupsFolder = path.join(__dirname, 'backups');

// Ensure the backups folder exists
if (!fs.existsSync(backupsFolder)) {
  fs.mkdirSync(backupsFolder, { recursive: true });
}

// Backup Route using Node.js mysqldump package
router.post("/backup", async (req, res) => {
  const now = new Date();
  
  // Generate the base filename (e.g., backup_MMDDYYYY)
  const baseFileName = `backup_${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;
  // Count how many backups already exist for today
  const existingBackups = fs.readdirSync(backupsFolder).filter(file => file.startsWith(baseFileName)).length;
  // Create the final filename with sequence number
  const backupNumber = existingBackups + 1;
  const fileName = `${baseFileName}_${backupNumber}.sql`;
  const backupPath = path.join(backupsFolder, fileName);
  
  try {
    // Use the Node.js mysqldump package to generate the backup file
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
    res.status(200).json({ message: "Backup successful", backupFile: fileName });
  } catch (error) {
    console.error(`❌ Error creating backup: ${error.message}`);
    res.status(500).json({ error: "Backup failed", details: error.message });
  }
});

// Restore Route (using the mysql client)
// Note: Ensure that the `mysql` command is available on your host machine (e.g., in Railway's Linux environment).
router.post("/restore", (req, res) => {
  const { backupFile } = req.body; // Expect backupFile like "backup_MMDDYYYY_1.sql"
  if (!backupFile) {
    return res.status(400).json({ error: "Please provide a backup file name." });
  }

  const backupPath = path.join(backupsFolder, backupFile);
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }

  // Build the restore command (using the mysql client, assumed to be in PATH)
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
