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

  config = loaded;
  return loaded;
}

export function getApiUrl(): string {
  if (!config)
    throw new Error("Config not loaded, call the loadConfig() first");
  return `${config.apiUrl}/api`; // if local use config.apiUrl, when deploying us `${config.apiUrl}/api`
}

export function getFirebaseConfig(): FireBaseConfig {
  if (!config) {
    throw new Error("Config not loaded, call loadConfig() first");
  }
  return config.firebase;
}
