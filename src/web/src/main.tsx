import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { loadConfig } from "./config.ts";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.tsx";
import OfflineBanner from "./components/layout/OfflineBanner.tsx";
import { ToastProvider } from "./components/layout/Toast.tsx";
//import { AppQueryProvider } from "./queryClient.tsx";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm(" Anew version of Unitrade is available. Reload to update?")) {
      updateSW(true);
    }
  },
  onOfflineReady(){
    console.log("UniTrade is ready to work offline.");
  },
})
//const queryClient = new QueryClient();

loadConfig().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <ToastProvider>
         <OfflineBanner />
          <App />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
});
