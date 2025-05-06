import { createRoot } from "react-dom/client";
import { StrictMode, useEffect, useState } from "react";

import "../src/styles/index.css";
import background from "./assets/wavy-lines.svg";

function App() {
  const [rut, setRut] = useState("");
  const [hostname, setHostname] = useState("");

  const minimizeToTray = () => {
    console.log("RUT ingresado:", rut);
    window.electronAPI.minimizeToTray();
  };

  useEffect(() => {
    const fetchHostname = async () => {
      try {
        const hostname = await window.electronAPI.getHostname();
        setHostname(hostname);
        console.log("Nombre del PC:", hostname);
      } catch (error) {
        console.error("Error al obtener el nombre del PC:", error);
      }
    };

    fetchHostname();
  }, []);

  return (
    <div className="flex flex-col bg-[#1b1b1f] relative">
      <img
        src={background}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="flex flex-col items-center justify-center h-screen relative">
        <div className="flex flex-col flex-1 gap-3 w-96 items-center justify-center">
          <input
            type="text"
            id="rut"
            name="rut"
            placeholder="Ingresar rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-500 transition-colors duration-300 placeholder:text-neutral-500 text-white font-semibold"
          />

          <button
            className="bg-[#32363f] hover:bg-[#414853] transition-all duration-300 px-4 py-2 rounded-lg w-full cursor-pointer text-sm text-white font-semibold"
            onClick={minimizeToTray}
          >
            Minimizar al Tray
          </button>
        </div>

        {hostname && (
          <div className="absolute bottom-0 rounded-full mx-auto px-4 py-2 bg-[#202127] m-5">
            <h2 className="text-white text-xs font-semibold">{hostname}</h2>
          </div>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
