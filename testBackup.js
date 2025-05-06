const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';
const dbName = 'railway';
const dbPort = 16446;
const backupsFolder = path.join(__dirname, 'backups');

if (!fs.existsSync(backupsFolder)) {
    fs.mkdirSync(backupsFolder, { recursive: true });
}

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
        console.error(`❌ Manual backup failed: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Backup stderr: ${stderr}`);
    }
    console.log(`✅ Manual backup successfully created at: ${backupPath}`);
});
