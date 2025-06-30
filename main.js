const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { ipcMain } = require("electron");
const fs = require("fs");
var win;
var dl;
function createWindow2() {
  const win = new BrowserWindow({
    width: 300,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
    alwaysOnTop: true,
    resizable: false,
    frame: false,
    transparent: true,
    titleBarStyle: "customButtonsOnHover",
  });

  win.setIcon(path.join(__dirname, "images/logo.png"));
  win.loadFile(path.join(__dirname, "preload.html"));
}
function closeLoad() {
  const win = BrowserWindow.getAllWindows()[0];
  win.close();
}
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
    resizable: false,
    frame: false,
    titleBarStyle: "customButtonsOnHover",
  });
  win.setIcon(path.join(__dirname, "images/logo.png"));
  win.loadFile(path.join(__dirname, "index.html"));
}
app.whenReady().then(() => {
  createWindow2();
  setTimeout(() => {
    closeLoad();
    createWindow();
  }, 5000);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// VARIABLES
var file_size,
  status = true,
  error;

function handleClose() {
  try {
    dl.destroy();
    const win = BrowserWindow.getFocusedWindow();
    win.close();
  } catch (err) {
    const win = BrowserWindow.getFocusedWindow();
    win.close();
  }
}
function handleMinimize() {
  const win = BrowserWindow.getFocusedWindow();
  win.minimize();
}
async function handleFetch(event, url) {
  try {
    status = true;
    const URL = require("url");
    const parsedUrl = URL.parse(url);
    await getFileSize(url);
    if (status == false) throw error;
    const fileName = parsedUrl.pathname.split("/").pop();
    const hostname = parsedUrl.hostname;
    console.log(app.getPath("downloads"));
    return {
      fname: fileName,
      hname: hostname,
      fsize: file_size,
      path: app.getPath("downloads"),
      url: url,
      status: status,
    };
  } catch (err) {
    status = false;
    return { status: status, error: err };
  }
}

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (canceled) {
    return app.getPath("downloads");
  } else {
    return filePaths[0];
  }
}
ipcMain.on("close-window", handleClose);
ipcMain.on("minimize-window", handleMinimize);
ipcMain.handle("fetch-url", handleFetch);
ipcMain.handle("file-open", handleFileOpen);
ipcMain.handle("download", downloadFile);
ipcMain.on("file-show", fshow);

async function getFileSize(url) {
  const ufs = require("url-file-size");
  file_size = await ufs(url).catch((error) => {
    status = false;
    error = error;
  });
}
async function downloadFile(event, dir, url) {
  status = true;
  try {
    var start;
    const EasyDl = require("easydl");
    const fs = require("fs");
    const path = require("path");
    const dir2 = path.dirname(dir);
    // Dynamically decide number of chunks: 10MB per chunk, min 1, max 16
    const chunkSizeBytes = 10 * 1024 * 1024; // 10MB
    let numChunks = 8;
    if (typeof file_size === 'number' && file_size > 0) {
      numChunks = Math.ceil(file_size / chunkSizeBytes);
      numChunks = Math.max(1, Math.min(numChunks, 16));
    }
    const statusFile = path.join(dir2, ".download_status.json");
    let chunkStatus = Array(numChunks).fill(false);
    // Try to load previous status
    if (fs.existsSync(statusFile)) {
      try {
        const prev = JSON.parse(fs.readFileSync(statusFile));
        if (Array.isArray(prev) && prev.length === numChunks) chunkStatus = prev;
      } catch {}
    }
    fs.mkdir(dir2, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
      }
    });
    console.log("done");

    try {
      dl = new EasyDl(url, dir, {
        connections: numChunks,
        chunkSize: (s) => {
          return s;
        },
        reportInterval: 5,
        skipChunks: chunkStatus.map((done, i) => done ? i : -1).filter(i => i !== -1),
      });
      start = new Date();

      await dl
        .on("metadata", (meta) => {
          console.log("download has been started");
          console.log("[metadata]", meta);
        })
        .on("progress", ({ details, total }) => {
          // Mark finished chunks
          details.forEach((chunk, idx) => {
            if (chunk.percentage === 100) chunkStatus[idx] = true;
          });
          // Save status
          fs.writeFileSync(statusFile, JSON.stringify(chunkStatus));
          win.webContents.send(
            "downloading",
            details,
            total,
            getTimeDifference(start, new Date()),
            chunkStatus
          );
        })
        .on("build", (progress) => {
          console.log("merging files ...", progress.percentage, "%");
        })
        .on("end", () => {
          // Clean up status file on success
          if (fs.existsSync(statusFile)) fs.unlinkSync(statusFile);
          console.log("Download completed!");
        })
        .wait();
    } catch (err) {
      console.log("[error]", err);
      win.webContents.send("error", err);
      dl.destroy();
    }
  } catch (err) {
    win.webContents.send("error", err);
    dl.destroy();
  }
}
function getTimeDifference(date1, date2) {
  var diff = date2 - date1;
  var diffInSeconds = diff / 1000;
  var diffInMinutes = diffInSeconds / 60;
  var diffInHours = diffInMinutes / 60;
  var diffInDays = diffInHours / 24;
  var seconds = Math.round(diffInSeconds % 60);
  var minutes = Math.round(diffInMinutes % 60);
  var hours = Math.round(diffInHours % 24);
  var days = Math.round(diffInDays);

  if (days > 0) {
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  } else if (hours > 0) {
    return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  } else if (minutes > 0) {
    return `${minutes} minutes, ${seconds} seconds`;
  } else {
    return `${seconds} seconds`;
  }
}
function fshow(event, data) {
  console.log("In Here");
  const { shell } = require("electron");
  console.log(data.path);
  shell.showItemInFolder(data.path);
}
