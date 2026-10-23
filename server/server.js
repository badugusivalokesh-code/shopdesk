import dotenv from "dotenv";

import dns from "node:dns";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { validateEnv } from "./config/env.js";

dotenv.config();

/**
 * The most recently created app instance. It remains null when this module is
 * imported, so importing server.js never starts a listener or a DB attempt.
 */
export let app = null;

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function configureDns(servers) {
  if (servers?.length) {
    dns.setServers(servers);
  }
}

/**
 * Validate configuration, connect to MongoDB, then create and listen on the
 * API. Rejections are allowed to reach the caller after a clear log message,
 * which guarantees no listener is opened on either failure path.
 */
export async function startServer({
  environment = process.env,
  config: providedConfig,
  logger = console,
} = {}) {
  let config;

  try {
    config = providedConfig ?? validateEnv(environment);
    configureDns(config.dnsServers);
  } catch (error) {
    logger.error(`[ShopDesk] Startup configuration failed: ${errorMessage(error)}`);
    throw error;
  }

  try {
    await connectDB(config);
  } catch (error) {
    logger.error(`[ShopDesk] MongoDB connection failed: ${errorMessage(error)}`);
    throw error;
  }

  app = createApp(config);

  const server = app.listen(config.port, () => {
    logger.log(`ShopDesk API server listening on port ${config.port}`);
  });

  return server;
}

const isEntryPoint =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isEntryPoint) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}

export { app as default };
