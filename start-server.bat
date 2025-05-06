@echo off
cd C:\Users\nrlic\OneDrive\Documents\church-duty-tracker

:: Start Node.js server in the background (without keeping CMD open)
start /B node server.js

:: Wait a few seconds to ensure the server is running
timeout /t 3 >nul

:: Open localhost only if it's not already open
tasklist | find /i "chrome.exe" >nul || start http://localhost:3000/login.html

:: Exit to prevent terminal window from staying open
exit
