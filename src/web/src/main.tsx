import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadConfig } from "./config.ts";
import "./index.css";
import App from "./App.tsx";
import OfflineBanner from "./components/layout/OfflineBanner.tsx";
import { ToastProvider } from "./components/layout/Toast.tsx";
//import { AppQueryProvider } from "./queryClient.tsx";

const queryClient = new QueryClient();

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