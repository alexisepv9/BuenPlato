/**
 * Cliente HTTP único del frontend.
 * Centraliza la URL base, credenciales de sesión, trazabilidad de solicitudes
 * y traducción de errores del backend a mensajes comprensibles.
 */
import axios from "axios";

type RequestTrace = {
  id: string;
  startedAt: number;
};

declare module "axios" {
  interface InternalAxiosRequestConfig {
    trace?: RequestTrace;
  }
}

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

function createRequestId(): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

apiClient.interceptors.request.use((config) => {
  const trace: RequestTrace = {
    id: createRequestId(),
    startedAt: performance.now(),
  };
  config.trace = trace;
  config.headers.set("X-Request-ID", trace.id);

  if (import.meta.env.DEV) {
    console.info(
      `[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      { requestId: trace.id, params: config.params, data: config.data },
    );
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const trace = response.config.trace;
    if (import.meta.env.DEV) {
      console.info(
        `[API ←] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          requestId: response.headers["x-request-id"] ?? trace?.id,
          durationMs: trace ? Math.round(performance.now() - trace.startedAt) : undefined,
          data: response.data,
        },
      );
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const trace = error.config?.trace;
      if (error.response?.status === 401 && error.config?.url !== "/auth/login") {
        window.dispatchEvent(new Event("buenplato:unauthorized"));
      }
      if (import.meta.env.DEV) {
        console.error(
          `[API ✕] ${error.response?.status ?? "SIN RESPUESTA"} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          {
            requestId: error.response?.headers["x-request-id"] ?? trace?.id,
            durationMs: trace ? Math.round(performance.now() - trace.startedAt) : undefined,
            code: error.code,
            message: error.message,
            response: error.response?.data,
          },
        );
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      return responseData.message;
    }
    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }
    if (error.code === "ECONNABORTED") {
      return "La API tardó demasiado en responder. Comprueba que el backend siga ejecutándose.";
    }
    if (!error.response) {
      return `No se pudo conectar con la API: ${error.message}`;
    }
    return `La API respondió con un error ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}
