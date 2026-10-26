import axios from "axios";

import type { User } from "./types";

export const AUTH_TOKEN_STORAGE_KEY = "shopdesk-auth-token";
export const AUTH_USER_STORAGE_KEY = "shopdesk-auth-user";
export const AUTH_EXPIRED_EVENT = "shopdesk:auth-expired";

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in a restricted browser context.
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    throw new Error("Session storage is unavailable.");
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    throw new Error("Session storage is unavailable.");
  }
}

export function getStoredAuthToken(): string | null {
  return readLocalStorage(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthUser(user: User): void {
  writeLocalStorage(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function setStoredAuthSession(token: string, user: User): void {
  try {
    writeLocalStorage(AUTH_TOKEN_STORAGE_KEY, token);
    setStoredAuthUser(user);
  } catch (error: unknown) {
    clearStoredAuth();
    throw error;
  }
}

export function clearStoredAuth(): void {
  removeLocalStorage(AUTH_TOKEN_STORAGE_KEY);
  removeLocalStorage(AUTH_USER_STORAGE_KEY);
}

function dispatchAuthExpired(): void {
  clearStoredAuth();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestAuthorization = error.config?.headers?.get("Authorization");
      const currentToken = getStoredAuthToken();

      // A late 401 for an older session must not erase a newer login.
      if (
        !currentToken ||
        typeof requestAuthorization !== "string" ||
        requestAuthorization === `Bearer ${currentToken}`
      ) {
        dispatchAuthExpired();
      }
    }

    return Promise.reject(error);
  },
);
