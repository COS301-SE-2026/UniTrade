import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadConfig } from "./config.ts";
import { RealtimeProvider } from "./providers/RealtimeProvider.tsx";
import "./index.css";
import App from "./App.tsx";
import { ToastProvider } from "./components/layout/Toast.tsx";
//import { AppQueryProvider } from "./queryClient.tsx";

const queryClient = new QueryClient();

loadConfig().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
        <ToastProvider>
          <App />
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
});
