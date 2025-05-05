import { app, BrowserWindow, ipcMain, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "os";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let mainWin;
let tray = null;
let popupInterval = null;
function restartPopupTimer() {
  console.log("Restarting popup timer");
  if (popupInterval) clearInterval(popupInterval);
  popupInterval = setInterval(() => {
  }, 1e3 * 60 * 1);
}
function createTray(iconPath) {
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir",
      click: () => {
        if (mainWin) {
          mainWin.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: "Cerrar",
      enabled: false
    }
  ]);
  tray.setToolTip(app.name);
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    if (mainWin) {
      mainWin.show();
    }
  });
}
function createWindow() {
  mainWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  mainWin.webContents.on("did-finish-load", () => {
    mainWin == null ? void 0 : mainWin.webContents.send(
      "main-process-message",
      (/* @__PURE__ */ new Date()).toLocaleString()
    );
  });
  if (VITE_DEV_SERVER_URL) {
    mainWin.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWin.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWin = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  createTray(path.join(process.env.VITE_PUBLIC, "electron-vite.png"));
  ipcMain.handle("get-hostname", () => os.hostname());
  ipcMain.on("minimize-to-tray", () => {
    console.log("Llamando minimize-to-tray");
    mainWin == null ? void 0 : mainWin.hide();
    restartPopupTimer();
  });
  ipcMain.on("restore-from-tray", () => {
    mainWin == null ? void 0 : mainWin.show();
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
