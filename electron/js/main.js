const { app, BrowserWindow, ipcMain } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(app.getAppPath(), 'capsvm.sqlite');

/*
const dbPath = path.join(app.getPath('userData'), 'capsvm.sqlite');

if (!fs.existsSync(dbPath)) {
  const sourceDbPath = path.join(app.getAppPath(), 'capsvm.sqlite');
  
  try {
    fs.copyFileSync(sourceDbPath, dbPath);
  } catch (err) {
    console.error('Erreur lors de la copie de la base de données :', err);
  }
}
*/

const db = new Database(dbPath);

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
