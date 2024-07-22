process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { app, BrowserWindow, ipcMain, net } = require("electron");
const Database = require("better-sqlite3");
const https = require("https");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(app.getAppPath(), "capsvm.sqlite"); // pour npm start

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
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
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

// Get all server information
ipcMain.on("get-server", (event, arg) => {
    try {
        const rows = db.prepare("SELECT * FROM server").all();
        event.reply("get-server-reply", { server: rows });
    } catch (err) {
        console.error(err.message);
        event.reply("get-server-reply", { error: err.message });
    }
});

ipcMain.handle(
    "status-request",
    async (event, serverUrl, endpoint, combinedToken) => {
        return new Promise((resolve, reject) => {
            const postData = "";

            const options = {
                hostname: serverUrl,
                port: 443,
                path: endpoint,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + combinedToken,
                    "Content-Length": Buffer.byteLength(postData),
                },
            };

            const req = https.request(options, (res) => {
                const statusCode = res.statusCode;
                resolve({ statusCode });
            });

            req.on("error", (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }
);

ipcMain.handle(
    "send-post-request",
    async (event, serverUrl, endpoint, combinedToken, postData) => {
        return new Promise((resolve, reject) => {

            const options = {
                hostname: serverUrl,
                port: 443,
                path: endpoint,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + combinedToken,
                    "Content-Length": Buffer.byteLength(postData),
                },
            };

            const req = https.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    const statusCode = res.statusCode;
                    resolve({ statusCode, data });
                });
            });

            req.on("error", (error) => {
                reject(error);
            });

            req.write(postData);
            req.end();
        });
    }
);

ipcMain.on("add-server", (event, arg) => {
    try {
        db.prepare(
            "INSERT INTO server (name, ip, user, password) VALUES (?, ?, ?, ?)"
        ).run(arg.name, arg.ip, arg.username, arg.password);
        event.reply("add-server-reply", {success: true});
    } catch(err) {
      console.error(err.message);
      event.reply("add-server-reply", { error: err.message });
    }
});

ipcMain.on("delete-server", (event, arg) => {
    try {
        db.prepare("DELETE FROM server WHERE name = ?").run(arg.name);
        event.reply("delete-server-reply", {success: true});
    } catch(err) {
      console.error(err.message);
      event.reply("delete-server-reply", { error: err.message });
    }
});

ipcMain.on("update-server", (event, arg) => {
    try {
        db.prepare(
            "UPDATE server SET name = ?, ip = ?, user = ?, password = ? WHERE name = ?"
        ).run(arg.name, arg.ip, arg.username, arg.password, arg.lastName);
        event.reply("update-server-reply", {success: true});
    } catch(err) {
      console.error(err.message);
      event.reply("update-server-reply", { error: err.message });
    }
});