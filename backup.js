const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Database credentials for your Railway database.
const dbHost = 'hopper.proxy.rlwy.net';
const dbUser = 'root';
const dbPassword = 'UwwQOpuOguVEktXetgEwnwVISHBWvtel';  
const dbName = 'railway';

// Create a backup file name with a timestamp.
const now = new Date();
const fileName = `backup_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.sql`;

// Define the backup folder path.
const backupsFolder = path.join(__dirname, 'backups');

// Check if backups folder exists, if not, create it.
if (!fs.existsSync(backupsFolder)) {
  fs.mkdirSync(backupsFolder, { recursive: true });
  console.log('Created backups folder at:', backupsFolder);
}

const backupPath = path.join(backupsFolder, fileName);

// Build the mysqldump command with host parameter included.
let mysqldumpCommand = `mysqldump -h ${dbHost} -u ${dbUser} --password=${dbPassword} "${dbName}" > "${backupPath}"`;

console.log("Running backup command...");

// Execute the command.
exec(mysqldumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error creating backup: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Backup stderr: ${stderr}`);
  }
  console.log(`Backup successfully created at: ${backupPath}`);
});
