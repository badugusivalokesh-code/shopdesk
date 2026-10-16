import axios from "axios";

/**
 * Shared Axios instance for ShopDesk API requests.
 *
 * Phase 1 scope: configuration only. No request functions or endpoint
 * calls are implemented here yet — those arrive in Phase 2 alongside the
 * corresponding server routes.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});
