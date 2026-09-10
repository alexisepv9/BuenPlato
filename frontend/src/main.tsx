/**
 * Punto de entrada del frontend Buen Plato.
 * Monta React, carga los estilos globales y activa StrictMode para detectar
 * efectos secundarios inseguros durante el desarrollo.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
