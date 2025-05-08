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
const rateLimit = require('express-rate-limit');

require('./autobackup');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

// Add session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Global rate limiter (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

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


