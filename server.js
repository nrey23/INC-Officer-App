// Main server file for the Church Duty Tracker application
// This file sets up the Express server and configures middleware and routes

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cron = require('node-cron'); // Used for scheduling automated database backups
const path = require('path');
const fs = require('fs');
const mysqldump = require('mysqldump'); // Node.js utility for MySQL database backups
const { google } = require('googleapis'); // Google Drive API integration for backup storage
const fileUpload = require('express-fileupload');

// Initialize automatic backup functionality
require('./autobackup');

// Create Express application instance
const app = express();

// Configure middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(fileUpload()); // Enable file upload functionality

// Serve static files (HTML, CSS, JS, images) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes under the /api prefix
app.use('/api', routes);

// Root route handler - serves the login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Server configuration
// Use the port provided by Railway (production) or default to 8080 (development)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (process.env.PORT=${process.env.PORT})`);
});


