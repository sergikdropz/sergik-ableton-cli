// Minimal test to verify Electron can load a main file
const fs = require('fs');
const path = require('path');

const testLogPath = path.join(__dirname, 'electron-test.log');
fs.writeFileSync(testLogPath, `ELECTRON TEST STARTED AT: ${new Date().toISOString()}\n`);

const { app } = require('electron');

fs.appendFileSync(testLogPath, `Electron app loaded\n`);

app.whenReady().then(() => {
  fs.appendFileSync(testLogPath, `app.whenReady() fired\n`);
  app.quit();
});

fs.appendFileSync(testLogPath, `Module loaded successfully\n`);

