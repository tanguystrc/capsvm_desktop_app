const { app, BrowserWindow } = require("electron/main");
const Database = require('better-sqlite3');
const path = require('path');
let dbPath = path.join(__dirname, '../db/capsvm.sqlite');
let db = new Database(dbPath);

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
    win.loadFile("capsvmApp.html");
};

app.whenReady().then(() => {
    createWindow();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
