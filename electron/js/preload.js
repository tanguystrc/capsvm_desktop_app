const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("sqlite_server", {
    getServers: () => ipcRenderer.send("get-server"),
    onServersGet: (callback) =>
        ipcRenderer.on("get-server-reply", (event, arg) => callback(arg)),
    addServer: (name, ip, username, password) => ipcRenderer.send("add-server", { name, ip, username, password }),
    onServerAdd: (callback) =>
        ipcRenderer.on("add-server-reply", (event, arg) => callback(arg)),
});

contextBridge.exposeInMainWorld('get_server_status', {
    sendPostRequest: async (serverUrl, endpoint, combinedToken) => {
        try {
            let response = await ipcRenderer.invoke('status-request', serverUrl, endpoint, combinedToken);
            console.error(response);
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'appel à status-request  : ', error);
            throw error;
        }
    }
});

contextBridge.exposeInMainWorld('send_post_request', {
    sendPostRequest: async (serverUrl, endpoint, combinedToken, postData) => {
        try {
            let response = await ipcRenderer.invoke('send-post-request', serverUrl, endpoint, combinedToken, postData);
            console.error(response);
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'appel à send-post-request  : ', error);
            throw error;
        }
    }
});