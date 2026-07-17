import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers";
import "../common/styles/index.css";

const appElement = document.getElementById("app");
if (!appElement) {
  const error = new Error('Application root element "#app" was not found');
  console.error("Unable to start application", error);
  throw error;
}

try {
  createRoot(appElement).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
} catch (error) {
  console.error("Unable to render application", error);
  throw error;
}
