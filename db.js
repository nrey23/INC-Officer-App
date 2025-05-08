// db.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST?.trim(), // Remove any whitespace
    user: process.env.DB_USER?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    port: parseInt(process.env.DB_PORT) || 3306
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        // Don't throw, just log the error
        return;
    }
    console.log('✅ Connected to MySQL');
});

// Handle connection errors
db.on('error', (err) => {
    console.error('❌ Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Attempting to reconnect...');
        db.connect();
    } else {
        throw err;
    }
});

module.exports = db;
