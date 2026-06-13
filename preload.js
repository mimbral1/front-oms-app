const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Por ejemplo, podrías exponer funciones para cerrar la app o mandar logs
  quit: () => {
    window.close();
  },
  // Puedes agregar más según lo necesites
});
contextBridge.exposeInMainWorld("windowAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
});
