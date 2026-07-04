import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers";
import "@/common/styles/index.css";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
