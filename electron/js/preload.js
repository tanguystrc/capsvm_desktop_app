const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sqlite_server", {
    getServers: () => ipcRenderer.send("get-server"),
    onServersGet: (callback) =>
        ipcRenderer.on("get-server-reply", (event, arg) => callback(arg)),
    setServer: (server) => ipcRenderer.send("set-server", server),
    onServerSet: (callback) =>
        ipcRenderer.on("set-server-reply", (event, arg) => callback(arg)),
});

contextBridge.exposeInMainWorld('get_server_status', {
    sendPostRequest: async (serverUrl, endpoint, combinedToken) => {
        try {
            let response = await ipcRenderer.invoke('send-post-request', serverUrl, endpoint, combinedToken);
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'appel à send-post-request  : ', error);
            console.error('Server URL:', serverUrl);
            throw error;
        }
    }
});