/*import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { loadConfig } from "./config.ts";
import "./index.css";
import App from "./App.tsx";
import { AppQueryProvider } from "./queryClient.tsx";

loadConfig().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppQueryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </AppQueryProvider>
    </StrictMode>,
  );
});
