// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'hopper.proxy.rlwy.net',
    user: 'root',
    password: 'UwwQOpuOguVEktXetgEwnwVISHBWvtel',
    database: 'railway',
    port: 16446
});

db.connect((err) => {
    if (err) throw err;
    console.log('✅ Connected to MySQL');
});

module.exports = db;
    