interface AppEnv {
  apiBaseUrl: string;
}

export const readAppEnv = (): AppEnv => ({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
});
