// src/renderer/popup.tsx
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "../src/styles/index.css";
import background from "./assets/wavy-lines.svg";

function Popup() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const closedByUser = useRef(false);

  const handleClose = (isUserAction: boolean) => {
    // Cancelar el intervalo si existe
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Establecer si fue acción del usuario
    closedByUser.current = isUserAction;

    // Enviar el evento de cierre con la información
    window.electronAPI.ipcRenderer.send("close-popup", {
      closedByUser: closedByUser.current,
    });
  };

  useEffect(() => {
    // Configurar un único intervalo que actualiza la cuenta regresiva
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleClose(false); // Cierre automático (no es acción del usuario)
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Limpieza al desmontar
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1b1b1f] relative">
      <img
        src={background}
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="relative text-center">
        <h2 className="text-2xl font-bold text-gray-100">
          ¿Sigues frente al computador?
        </h2>
        <p className="text-gray-400 text-pretty text-xs pb-3">
          Por favor confirma que sigues activo.
        </p>

        <button
          onClick={() => handleClose(true)}
          className={`
          px-4 py-2 rounded-lg
          bg-gradient-to-r from-blue-600 to-blue-400
          text-white hover:from-blue-500 hover:to-blue-400
          transition-all duration-200 cursor-pointer
          `}
        >
          Sí, sigo aquí ({timeLeft})
        </button>

        <p className="text-xs text-gray-500 py-2">
          La sesión se cerrará automáticamente si no hay actividad
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Popup />
  </StrictMode>
);
