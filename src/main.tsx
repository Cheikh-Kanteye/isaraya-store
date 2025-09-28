import { createRoot } from "react-dom/client";
import "./css/index.css";
import App from "./App";

// Enregistrement du service worker Firebase pour les notifications push
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registered successfully:", registration.scope);
      })
      .catch((err) => {
        console.error("❌ Service Worker registration failed:", err.message);
      });
  });
} else if (import.meta.env.DEV) {
  console.info("📧 Service Worker disabled in development mode - Push notifications not available");
}

createRoot(document.getElementById("root")!).render(<App />);
