// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cron = require('node-cron'); // 🔄 Added for scheduling backups
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files using an absolute path
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routes);

// Instead of two "/" routes, use one for serving the login interface.
// If you need a separate status route, you can add this:
// app.get("/status", (req, res) => {
//    res.send("✅ Server is running successfully!");
// });

// Serve the login.html file at the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Bind the server to the correct Railway-assigned port:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT} (process.env.PORT=${process.env.PORT})`));


// 🔄 Auto-Backup Setup (Runs Every 3 Days at Midnight)
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';
const dbName = 'railway';
const dbPort = 16446;
const backupsFolder = path.join(__dirname, 'backups');

// Ensure backups folder exists
if (!fs.existsSync(backupsFolder)) {
    fs.mkdirSync(backupsFolder, { recursive: true });
}

cron.schedule('0 0 */3 * *', () => {
    console.log("⏳ Running automated backup...");

    const now = new Date();
    const baseFileName = `autobackup_${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getFullYear()}`;
    const existingBackups = fs.readdirSync(backupsFolder).filter(file => file.startsWith(baseFileName)).length;
    const backupNumber = existingBackups + 1;
    const fileName = `${baseFileName}_${backupNumber}.sql`;
    const backupPath = path.join(backupsFolder, fileName);

    // mysqldump command
    const mysqldumpPath = "mysqldump"; // Let Railway resolve the correct path
    const command = `${mysqldumpPath} -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} "${dbName}" > "${backupPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Auto-backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Backup stderr: ${stderr}`);
        }
        console.log(`✅ Auto-backup successfully created at: ${backupPath}`);
    });
}, {
    scheduled: true,
    timezone: "Asia/Manila" // Adjust to match your local timezone
});
