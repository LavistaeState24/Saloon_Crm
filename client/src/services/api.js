import axios from "axios";
import { authStorage } from "../utils/storage";
import { getApiErrorMessage, toast } from "../utils/toast";

const normalizeApiBaseUrl = (url) => {
  const fallbackUrl = import.meta.env.DEV ? "http://localhost:5000" : "";
  const resolvedUrl = url || fallbackUrl;

  if (!resolvedUrl) {
    throw new Error("VITE_API_URL is not configured for this environment");
  }

  const trimmed = resolvedUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const getApiOrigin = () => {
  const baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  return baseUrl.replace(/\/api$/, "");
};

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
});

api.interceptors.request.use((config) => {
  const token = authStorage.getRawToken() || authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipToast) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && authStorage.getToken()) {
      authStorage.clear();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    if (error.response?.status !== 401) {
      const message = getApiErrorMessage(error, "Request failed");
      const toastId = error.response?.data?.code || `${error.response?.status || "error"}:${error.config?.url || ""}:${message}`;
      toast.error(message, { id: `api-error:${toastId}` });
    }

    return Promise.reject(error);
  }
);
