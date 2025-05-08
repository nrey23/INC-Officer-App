// Database configuration file
// Establishes and exports the MySQL database connection for the Church Duty Tracker application

const mysql = require('mysql2');

// Create database connection configuration
// Using Railway's MySQL service with proxy connection
const db = mysql.createConnection({
    host: 'hopper.proxy.rlwy.net',
    user: 'root',
    password: 'UwwQOpuOguVEktXetgEwnwVISHBWvtel',
    database: 'railway',
    port: 16446
});

// Attempt to establish database connection
// Throws error if connection fails, logs success message if connection succeeds
db.connect((err) => {
    if (err) throw err;
    console.log('✅ Connected to MySQL');
});

// Export the database connection for use in other modules
module.exports = db;
    