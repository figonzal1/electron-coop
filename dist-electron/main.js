import { app, BrowserWindow, ipcMain, globalShortcut, nativeImage, Tray, Menu } from "electron";
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
let popupWindow = null;
let popupInterval = null;
function setupPopupListeners() {
  ipcMain.removeAllListeners("close-popup");
  ipcMain.on("close-popup", (_, { closedByUser }) => {
    console.log(`Popup cerrado por ${closedByUser ? "usuario" : "timeout"}`);
    closePopup();
    if (!(mainWin == null ? void 0 : mainWin.isVisible())) {
      restartPopupTimer();
    }
    if (!closedByUser) {
      mainWin == null ? void 0 : mainWin.show();
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
  if (!(mainWin == null ? void 0 : mainWin.isVisible())) {
    popupInterval = setInterval(() => {
      if (!popupWindow && !(mainWin == null ? void 0 : mainWin.isVisible())) {
        createPopup();
      }
    }, 1e3 * 60 * 1);
  }
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
function createPopup() {
  if (popupWindow) return;
  popupWindow = new BrowserWindow({
    width: 400,
    height: 200,
    fullscreen: false,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: false,
    kiosk: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
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
  const BLOCKED_KEYS = /* @__PURE__ */ new Set([
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
    "Escape",
    "Alt",
    "Meta",
    "OS",
    "Super",
    "Hyper",
    "Tab",
    "PrintScreen",
    "ScrollLock",
    "Pause",
    "Insert",
    "Delete",
    "Home",
    "End",
    "PageUp",
    "PageDown"
  ]);
  const iconPath = process.platform === "win32" ? path.join(process.env.VITE_PUBLIC, "electron-vite.ico") : path.join(process.env.VITE_PUBLIC, "electron-vite.png");
  mainWin = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    kiosk: true,
    alwaysOnTop: true,
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false,
    icon: iconPath,
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
  mainWin.on("show", () => {
    if (popupInterval) {
      clearInterval(popupInterval);
      popupInterval = null;
    }
  });
  mainWin.webContents.on("before-input-event", (event, input) => {
    if (BLOCKED_KEYS.has(input.key)) {
      event.preventDefault();
      return;
    }
    if (input.control || input.alt || input.meta || input.shift) {
      event.preventDefault();
    }
    if (input.key === "Alt" && !input.alt) {
      event.preventDefault();
    }
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
  setupPopupListeners();
  ipcMain.handle("get-hostname", () => os.hostname());
  ipcMain.on("minimize-to-tray", () => {
    console.log("Llamando minimize-to-tray");
    mainWin == null ? void 0 : mainWin.hide();
    restartPopupTimer();
  });
  ipcMain.on("restore-from-tray", () => {
    mainWin == null ? void 0 : mainWin.show();
  });
  const BLOCKED_SHORTCUTS = [
    "CommandOrControl+Alt+Delete",
    "CommandOrControl+Shift+Esc",
    "Alt+F4",
    "CommandOrControl+W",
    "CommandOrControl+R",
    "CommandOrControl+T",
    "CommandOrControl+N",
    "F5",
    "F11",
    "F12",
    "Alt+Tab",
    "CommandOrControl+Tab",
    "Escape",
    "Super",
    // Tecla Windows/Command
    "Super+L",
    // Bloquear Windows
    "Super+D",
    // Mostrar escritorio
    "Super+R",
    // Ejecutar
    "Super+Tab"
    // Selector de aplicaciones
  ];
  BLOCKED_SHORTCUTS.forEach((shortcut) => {
    try {
      if (!globalShortcut.register(shortcut, () => {
        console.log(`Shortcut blocked: ${shortcut}`);
      })) {
        console.error(`Failed to block: ${shortcut}`);
      }
    } catch (error) {
      console.error(`Error blocking ${shortcut}:`, error);
    }
  });
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
