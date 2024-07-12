const { app, BrowserWindow, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../capsvm.sqlite');
let db;

try {
    db = new Database(dbPath, { verbose: console.log });
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.setMenuBarVisibility(false);
  win.maximize();
  win.loadFile('capsvmApp.html');
};

// Get all server information
ipcMain.on('get-server', (event, arg) => {
  try {
    const rows = db.prepare('SELECT * FROM server').all();
    event.reply('get-server-reply', { server: rows });
  } catch (err) {
    console.error(err.message);
    event.reply('get-server-reply', { error: err.message });
  }
});

// Set server information
ipcMain.on('set-server', (event, arg) => {
  try {
    db.prepare('UPDATE server SET name = ?, url = ?, token = ? WHERE id = 1').run(arg.name, arg.url, arg.token);
    event.reply('set-server-reply', { success: true });
  } catch (err) {
    console.error(err.message);
    event.reply('set-server-reply', { error: err.message });
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
