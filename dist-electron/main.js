import { app as n, BrowserWindow as c, ipcMain as s, nativeImage as P, Tray as T, Menu as v } from "electron";
import { fileURLToPath as _ } from "node:url";
import o from "node:path";
import I from "os";
const u = o.dirname(_(import.meta.url));
process.env.APP_ROOT = o.join(u, "..");
const a = process.env.VITE_DEV_SERVER_URL, O = o.join(process.env.APP_ROOT, "dist-electron"), f = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = a ? o.join(process.env.APP_ROOT, "public") : f;
let e, p = null, t = null, l = null;
function h() {
  s.removeAllListeners("close-popup"), s.on("close-popup", (r, { closedByUser: i }) => {
    console.log(`Popup cerrado por ${i ? "usuario" : "timeout"}`), R(), e != null && e.isVisible() || w(), i || e == null || e.show();
  });
}
function R() {
  t && (t.close(), t = null);
}
function w() {
  console.log("Restarting popup timer"), l && (clearInterval(l), l = null), e != null && e.isVisible() || (l = setInterval(() => {
    !t && !(e != null && e.isVisible()) && E();
  }, 1e3 * 60 * 1));
}
function b(r) {
  const i = P.createFromPath(r);
  p = new T(i);
  const m = v.buildFromTemplate([
    {
      label: "Abrir",
      click: () => {
        e ? e.show() : d();
      }
    },
    {
      label: "Cerrar",
      enabled: !1
    }
  ]);
  p.setToolTip(n.name), p.setContextMenu(m), p.on("double-click", () => {
    e && e.show();
  });
}
function E() {
  t || (t = new c({
    width: 400,
    height: 200,
    fullscreen: !1,
    alwaysOnTop: !0,
    frame: !1,
    skipTaskbar: !1,
    kiosk: !1,
    webPreferences: {
      preload: o.join(u, "preload.mjs")
    }
  }), s.listenerCount("close-popup") || h(), a ? t.loadURL("http://localhost:5173/popup.html") : t.loadFile(o.join(f, "popup.html")), t.on("closed", () => {
    t = null;
  }));
}
function d() {
  const r = process.platform === "win32" ? o.join(process.env.VITE_PUBLIC, "electron-vite.ico") : o.join(process.env.VITE_PUBLIC, "electron-vite.png");
  e = new c({
    width: 1280,
    height: 720,
    show: !0,
    kiosk: !1,
    alwaysOnTop: !1,
    fullscreen: !1,
    autoHideMenuBar: !0,
    frame: !0,
    icon: r,
    webPreferences: {
      preload: o.join(u, "preload.mjs")
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send(
      "main-process-message",
      (/* @__PURE__ */ new Date()).toLocaleString()
    );
  }), e.on("show", () => {
    l && (clearInterval(l), l = null);
  }), a ? e.loadURL(a) : e.loadFile(o.join(f, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  c.getAllWindows().length === 0 && d();
});
n.whenReady().then(() => {
  d(), b(o.join(process.env.VITE_PUBLIC, "electron-vite.png")), h(), s.handle("get-hostname", () => I.hostname()), s.on("minimize-to-tray", () => {
    console.log("Llamando minimize-to-tray"), e == null || e.hide(), w();
  }), s.on("restore-from-tray", () => {
    e == null || e.show();
  });
});
export {
  O as MAIN_DIST,
  f as RENDERER_DIST,
  a as VITE_DEV_SERVER_URL
};
