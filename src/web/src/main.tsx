import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { loadConfig } from "./config.ts";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.tsx";
import OfflineBanner from "./components/layout/OfflineBanner.tsx";
import { ToastProvider } from "./components/layout/Toast.tsx";


registerSW({ immediate: true });

// trigger
async function start() {
  const root = createRoot(document.getElementById("root")!);

  try {
    await loadConfig();
  } catch (err) {
    console.error("Failed to load app config", err);
    root.render(
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-gray-50">
        <h1 className="font-['Fraunces'] text-2xl text-gray-800">
          We couldn't load UniTrade
        </h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Check your internet connection and try again. If it keeps happening,
          the service may be temporarily down.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-navy-700 text-white rounded-xl text-sm font-bold hover:bg-navy-500 transition-colors"
        >
          Try again
        </button>
      </div>,
    );
    return;
  }

  root.render(
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
}

void start();