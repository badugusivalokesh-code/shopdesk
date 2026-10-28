import cors from "cors";
import express from "express";

import { getDatabaseStatus } from "./config/db.js";
import {
  DEFAULT_CLIENT_ORIGIN,
  normalizeClientOrigin,
} from "./config/env.js";
import { AppError, errorHandler } from "./middleware/errorHandler.js";
import { createAuthRouter } from "./routes/auth.routes.js";
import { createOrderRouter } from "./routes/order.routes.js";
import { createProductRouter } from "./routes/product.routes.js";
import { createStatsRouter } from "./routes/stats.routes.js";
import { createUserRouter } from "./routes/user.routes.js";

function readConfigValue(config, camelCaseKey, environmentKey, fallback) {
  return (
    config?.[camelCaseKey] ??
    config?.[environmentKey] ??
    fallback
  );
}

/**
 * Build the Express application without opening a listener.
 */
export function createApp(config = {}) {
  const app = express();
  const configuredClientOrigin = readConfigValue(
    config,
    "clientOrigin",
    "CLIENT_ORIGIN",
    DEFAULT_CLIENT_ORIGIN,
  );
  const clientOrigin = normalizeClientOrigin(configuredClientOrigin);
  const jwtSecret = readConfigValue(config, "jwtSecret", "JWT_SECRET", undefined);

  // A single configured origin prevents arbitrary browser origins from
  // reading API responses. The environment validator rejects wildcard and
  // malformed origins before production startup.
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json());

  app.get("/api/health", (request, response) => {
    const dbStatus = getDatabaseStatus();
    const isHealthy = dbStatus.readyState === 1;

    response.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      service: "shopdesk-api",
      database: dbStatus,
    });
  });

  app.use("/api/auth", createAuthRouter({ jwtSecret }));
  app.use("/api/products", createProductRouter({ jwtSecret }));
  app.use("/api/orders", createOrderRouter({ jwtSecret }));
  app.use("/api/stats", createStatsRouter({ jwtSecret }));
  app.use("/api/users", createUserRouter({ jwtSecret }));

  app.use((request, response, next) => {
    next(new AppError("Route not found", 404, "NOT_FOUND"));
  });

  app.use(errorHandler);

  return app;
}

export default createApp;
