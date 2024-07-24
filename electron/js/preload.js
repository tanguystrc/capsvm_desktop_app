const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sqlite_server", {
    getServers: () => ipcRenderer.send("get-server"),
    onServersGet: (callback) =>
        ipcRenderer.on("get-server-reply", (event, arg) => callback(arg)),
    addServer: (name, ip, username, password) => ipcRenderer.send("add-server", { name, ip, username, password }),
    onServerAdd: (callback) =>
        ipcRenderer.on("add-server-reply", (event, arg) => callback(arg)),
    deleteServer: (name) => ipcRenderer.send("delete-server", { name }),
    onServerDelete: (callback) =>
        ipcRenderer.on("delete-server-reply", (event, arg) => callback(arg)),
    updateServer: (name, ip, username, password, lastName) => ipcRenderer.send("update-server", { name, ip, username, password, lastName }),
    onServerUpdate: (callback) =>
        ipcRenderer.on("update-server-reply", (event, arg) => callback(arg)),
});

contextBridge.exposeInMainWorld('send_post_request', {
    sendPostRequest: async (serverUrl, combinedToken, postData) => {
        try {
            let response = await ipcRenderer.invoke('send-post-request', serverUrl, combinedToken, postData);
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'appel à send-post-request  : ', error);
            throw error;
        }
    }
});