const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
contextBridge.exposeInMainWorld('sqlite_server', {
    getServers: () => ipcRenderer.send('get-server'),
    onServersGet: (callback) => ipcRenderer.on('get-server-reply', (event, arg) => callback(arg)),
    setServer: (server) => ipcRenderer.send('set-server', server),
    onServerSet: (callback) => ipcRenderer.on('set-server-reply', (event, arg) => callback(arg))
});