import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from "electron";
//import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "os";

//const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let mainWin: BrowserWindow | null;
let tray: Tray | null = null;
let popupWindow: BrowserWindow | null = null;
let popupInterval: NodeJS.Timeout | null = null;

function setupPopupListeners() {
  // Limpiar cualquier listener previo para evitar duplicados
  ipcMain.removeAllListeners("close-popup");

  ipcMain.on("close-popup", (_, { closedByUser }) => {
    console.log(`Popup cerrado por ${closedByUser ? "usuario" : "timeout"}`);
    closePopup();

    if (!mainWin?.isVisible()) {
      restartPopupTimer();
    }

    if (!closedByUser) {
      mainWin?.show();
    }
  });
}

function closePopup() {
  if (popupWindow) {
    popupWindow.close();
    popupWindow = null;
  }
}

function restartPopupTimer() {
  console.log("Restarting popup timer");

  if (popupInterval) {
    clearInterval(popupInterval);
    popupInterval = null;
  }

  if (!mainWin?.isVisible()) {
    popupInterval = setInterval(() => {
      if (!popupWindow && !mainWin?.isVisible()) {
        // Doble verificación
        createPopup();
      }
    }, 1000 * 60 * 1); // cada 1 minuto
  }
}

function createTray(iconPath: string) {
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
      },
    },
    {
      label: "Cerrar",
      enabled: false,
    },
  ]);

  tray.setToolTip(app.name);
  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWin) {
      mainWin.show();
    }
  });
}

function createPopup() {
  if (popupWindow) return; // ya está activa

  popupWindow = new BrowserWindow({
    width: 400,
    height: 200,
    fullscreen: false,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: false,
    kiosk: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  if (!ipcMain.listenerCount("close-popup")) {
    setupPopupListeners();
  }

  if (VITE_DEV_SERVER_URL) {
    popupWindow.loadURL("http://localhost:5173/popup.html");
  } else {
    popupWindow.loadFile(path.join(RENDERER_DIST, "popup.html"));
  }

  popupWindow.on("closed", () => {
    popupWindow = null;
  });
}

function createWindow() {

  const iconPath = process.platform === 'win32' 
  ? path.join(process.env.VITE_PUBLIC, 'electron-vite.ico')
  : path.join(process.env.VITE_PUBLIC, 'electron-vite.png');

  mainWin = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    kiosk: false,
    alwaysOnTop: false,
    fullscreen: false,
    autoHideMenuBar: true,
    frame: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  mainWin.webContents.on("did-finish-load", () => {
    mainWin?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  mainWin.on("show", () => {
    if (popupInterval) {
      clearInterval(popupInterval);
      popupInterval = null;
    }
  });

  if (VITE_DEV_SERVER_URL) {
    mainWin.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWin.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWin = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray(path.join(process.env.VITE_PUBLIC, "electron-vite.png"));

  setupPopupListeners();

  ipcMain.handle("get-hostname", () => os.hostname());

  ipcMain.on("minimize-to-tray", () => {
    console.log("Llamando minimize-to-tray");
    mainWin?.hide();
    restartPopupTimer();
  });

  ipcMain.on("restore-from-tray", () => {
    mainWin?.show();
  });
});
