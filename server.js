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
app.use(express.static('public')); // to serve frontend
app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


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
    const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;
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
