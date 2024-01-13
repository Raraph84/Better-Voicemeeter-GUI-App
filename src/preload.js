const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    once: (channel, callable) => ipcRenderer.once(channel, (event, ...args) => callable(...args)),
    on: (channel, callable) => ipcRenderer.on(channel, (event, ...args) => callable(...args))
});
