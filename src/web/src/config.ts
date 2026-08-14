interface FireBaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}
interface AppConfig {
  apiUrl: string;
  firebase: FireBaseConfig;
}

let config: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (config) {
    return config;
  }

  const res = await fetch("/config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load runtime config");
  const loaded: AppConfig = await res.json();

  const parsed = new URL(loaded.apiUrl);
  const allowedProtocols = ["https:", "http:"];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`Invalid apiUrl protocol`);
  }
  const allowedHosts = [
    "ca-backend-prod.kindgrass-55a2ae94.southafricanorth.azurecontainerapps.io",
    "ca-backend-staging.calmtree-ce65e53e.southafricanorth.azurecontainerapps.io",
    "localhost:8080",
  ];
  if (!allowedHosts.includes(parsed.host)) {
    throw new Error(`apiUrl host not allowed: ${parsed.host}`);
  }
  config = { ...loaded, apiUrl: parsed.origin };
  return config;
}

export function getApiUrl(): string {
  if (!config)
    throw new Error("Config not loaded, call the loadConfig() first");
  return config.apiUrl; // if local use config.apiUrl, when deploying us `${config.apiUrl}/api`
}

export function getFirebaseConfig(): FireBaseConfig {
  if (!config) {
    throw new Error("Config not loaded, call loadConfig() first");
  }
  return config.firebase;
}
