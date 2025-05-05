/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

interface ElectronAPI {
  getHostname: () => Promise<string>;
  minimizeToTray: () => Promise<void>;

  ipcRenderer: {
    on: typeof import("electron").ipcRenderer.on;
    off: typeof import("electron").ipcRenderer.off;
    send: typeof import("electron").ipcRenderer.send;
    invoke: typeof import("electron").ipcRenderer.invoke;
  };
}

interface Window {
  electronAPI: ElectronAPI;
}
