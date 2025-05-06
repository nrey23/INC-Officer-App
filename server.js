const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cron = require('node-cron'); // 🔄 Scheduling backups
const path = require('path');
const fs = require('fs');
const mysqldump = require('mysqldump'); // ✅ Use Node.js package for backups
const { exec } = require('child_process');

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

// Bind the server to Railway-assigned port
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

async function createBackup() {
    const now = new Date();
    const fileName = `backup_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.sql`;
    const backupPath = path.join(backupsFolder, fileName);

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

        console.log(`✅ Backup successfully saved at ${backupPath}`);

        // 🚀 Auto-commit & push backup to GitHub
        exec(`git add backups && git commit -m "Backup: ${fileName}" && git push origin main`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Git commit failed: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Git stderr: ${stderr}`);
            }
            console.log(`✅ Backup pushed to GitHub successfully!`);
        });

    } catch (error) {
        console.error(`❌ Backup failed: ${error.message}`);
    }
}

// Schedule automatic backups
cron.schedule('0 0 */3 * *', createBackup, {
    scheduled: true,
    timezone: "Asia/Manila",
});
