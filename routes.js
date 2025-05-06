// routes.js
const express = require("express");
const router = express.Router();
const db = require("./db");

// routes.js
router.get('/member-count', (req, res) => {
  const query = 'SELECT COUNT(*) AS count FROM tbl_members';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ count: results[0].count });
  });
});


// ✅ ADD MEMBER
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

// ✅ UPDATE MEMBER
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


// ✅ GET ALL MEMBERS
router.get("/members", (req, res) => {
  db.query("SELECT * FROM tbl_members", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// ✅ DELETE MEMBER
router.delete("/delete-member/:id", (req, res) => {
  const memberId = req.params.id;
  const query = `DELETE FROM tbl_members WHERE member_id = ?`;
  db.query(query, [memberId], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed", error: err });
    res.json({ message: "Member deleted successfully" });
  });
});


// GET counts of members by role
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


//SECURITY FEATURES

const bcrypt = require("bcryptjs");

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




//BACKUP FEATURES

// routes.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for backups
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';  // Replace with your actual MySQL password
const dbName = 'railway'; // Use your correct database name
const dbPort = 16446; // ✅ Use uppercase P to match its usage below
const backupsFolder = path.join(__dirname, 'backups');

// Ensure the backups folder exists
if (!fs.existsSync(backupsFolder)) {
  fs.mkdirSync(backupsFolder, { recursive: true });
}

router.post("/backup", (req, res) => {
  const now = new Date();
  
  // Generate the base name without the sequence number
  const baseFileName = `backup_${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;

  // Get the existing backup count
  const existingBackups = fs.readdirSync(backupsFolder).filter(file => file.startsWith(baseFileName)).length;
  
  // Increment the backup number
  const backupNumber = existingBackups + 1;
  
  // Final filename with sequence number
  const fileName = `${baseFileName}_${backupNumber}.sql`;
  const backupPath = path.join(backupsFolder, fileName);
  
  // Build the mysqldump command
  const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;
  const command = `${mysqldumpPath} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} "${dbName}" > "${backupPath}"`;
  
  console.log("Running backup command...");
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error creating backup: ${error.message}`);
      return res.status(500).json({ error: "Backup failed", details: error.message });
    }
    if (stderr) {
      console.error(`Backup stderr: ${stderr}`);
    }
    console.log(`Backup successfully created at: ${backupPath}`);
    res.status(200).json({ message: "Backup successful", backupFile: fileName });
  });
});


router.post("/restore", (req, res) => {
  const { backupFile } = req.body; // Expect backupFile to be something like "backup_20250504_215643.sql"
  if (!backupFile) {
    return res.status(400).json({ error: "Please provide a backup file name." });
  }

  const backupPath = path.join(backupsFolder, backupFile);
  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: "Backup file not found." });
  }

  // Restore command using MySQL
  const restoreCommand = `mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} < "${backupPath}"`;

  console.log("📥 Running restore command:", restoreCommand);

  exec(restoreCommand, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Restore Failed!");
      console.error("Error message:", error.message);
      console.error("StdErr:", stderr);
      return res.status(500).json({ error: "Restore failed", details: error.message });
    }

    console.log("✅ Restore successful from:", backupPath);
    res.status(200).json({ message: "Restore successful", restoredFrom: backupFile });
  });
});


module.exports = router;
