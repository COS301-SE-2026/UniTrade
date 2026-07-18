interface AppConfig {
  apiUrl: string;
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
  if(config.apiUrl.endsWith('/api') || config.apiUrl.endsWith('/api/'))
  {
    return config.apiUrl.replace(/\/$/,"")
  }
  return  config.apiUrl; // if local use config.apiUrl, when deploying us `${config.apiUrl}/api`
}
