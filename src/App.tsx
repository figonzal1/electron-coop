import { createRoot } from "react-dom/client";
import { StrictMode, useEffect } from "react";

import "../src/styles/index.css";
import background from "./assets/wavy-lines.svg";

function App() {
  useEffect(() => {
    const fetchHostname = async () => {
      try {
        const hostname = await window.electronAPI.getHostname();
        console.log("Nombre del PC:", hostname);
      } catch (error) {
        console.error("Error al obtener el nombre del PC:", error);
      }
    };

    fetchHostname();
  }, []);

  return (
    <div className="min-h-screen h-full w-full bg-[#282828]">
      <img src={background} alt="background" className="fixed" />

      <div className="flex flex-col justify-center items-center  min-h-screen">
        <h1>Vite + React</h1>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
