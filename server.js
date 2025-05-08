// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cron = require('node-cron'); // For scheduling backups
const path = require('path');
const fs = require('fs');
const mysqldump = require('mysqldump'); // Node.js-based backup
const { google } = require('googleapis'); // Google Drive integration
const fileUpload = require('express-fileupload');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

require('./autobackup');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Session store configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST?.trim(),
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER?.trim(),
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim(),
    createDatabaseTable: true
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', routes);

// Serve the login.html file at the root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Bind the server to the correct Railway-assigned port:
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} (process.env.PORT=${process.env.PORT})`);
});


