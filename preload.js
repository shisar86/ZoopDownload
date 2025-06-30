const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setTitle: (title) => ipcRenderer.send("set-title", title),
  closeWindow: () => ipcRenderer.send("close-window"),
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  fetchURL: (url) => ipcRenderer.invoke("fetch-url", url),
  fileOpen: () => ipcRenderer.invoke("file-open"),
  download: (path, url) => ipcRenderer.invoke("download", path, url),
  meta: (size) => ipcRenderer.on("size", size),
  downloading: (chunk, total, tim) =>
    ipcRenderer.on("downloading", chunk, total, tim),
  error: (error) => ipcRenderer.on("error", error),
  fshow:(data)=>ipcRenderer.send("file-show",data)
});
