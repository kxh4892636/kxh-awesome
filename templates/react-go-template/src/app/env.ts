interface AppEnv {
  apiBaseUrl: string;
}

const DEFAULT_API_BASE_URL = "http://localhost:8080";

const parseApiBaseUrl = (value: unknown): string => {
  const candidate = value ?? DEFAULT_API_BASE_URL;
  if (typeof candidate !== "string" || candidate.trim() === "") {
    const error = new TypeError("VITE_API_BASE_URL must be a non-empty string");
    console.error("Invalid application environment", error);
    throw error;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new TypeError("VITE_API_BASE_URL must use http or https");
    }
    return url.toString().replace(/\/$/u, "");
  } catch (error) {
    console.error("Invalid VITE_API_BASE_URL", error);
    throw error;
  }
};

export const readAppEnv = (): AppEnv => ({
  apiBaseUrl: parseApiBaseUrl(import.meta.env["VITE_API_BASE_URL"]),
});
