import { isIP } from "node:net";

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Error raised when the process configuration cannot be used safely.
 */
export class EnvValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EnvValidationError";
    this.code = "CONFIG_ERROR";
    this.statusCode = 500;
  }
}

function readRequiredString(environment, key) {
  const value = environment[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new EnvValidationError(`${key} must be set to a non-empty value`);
  }

  return value.trim();
}

function parsePort(value) {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new EnvValidationError("PORT must be an integer between 1 and 65535");
  }

  const normalized = String(value).trim();
  const port = Number(normalized);

  if (
    normalized === "" ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new EnvValidationError("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parseDnsServers(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new EnvValidationError(
      "DNS_SERVERS must be a comma-separated list of IP addresses",
    );
  }

  const normalized = value.trim();

  if (normalized === "") {
    return undefined;
  }

  const servers = normalized.split(",").map((server) => server.trim());

  if (servers.some((server) => server === "" || isIP(server) === 0)) {
    throw new EnvValidationError(
      "DNS_SERVERS must be a comma-separated list of IP addresses",
    );
  }

  return servers;
}

export function normalizeClientOrigin(value) {
  const configuredOrigin =
    value === undefined || (typeof value === "string" && value.trim() === "")
      ? DEFAULT_CLIENT_ORIGIN
      : value;

  if (typeof configuredOrigin !== "string" || configuredOrigin.trim() === "") {
    throw new EnvValidationError("CLIENT_ORIGIN must be a valid HTTP(S) origin");
  }

  const origin = configuredOrigin.trim();

  if (origin === "*") {
    throw new EnvValidationError(
      "CLIENT_ORIGIN cannot use the wildcard origin; configure one trusted origin",
    );
  }

  let parsedOrigin;

  try {
    parsedOrigin = new URL(origin);
  } catch {
    throw new EnvValidationError("CLIENT_ORIGIN must be a valid HTTP(S) origin");
  }

  if (
    !["http:", "https:"].includes(parsedOrigin.protocol) ||
    !parsedOrigin.hostname ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== "/" ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new EnvValidationError("CLIENT_ORIGIN must be a valid HTTP(S) origin");
  }

  return parsedOrigin.origin;
}

/**
 * Validate and normalize the environment needed by the API process.
 *
 * The optional argument makes the function deterministic in tests while the
 * default keeps normal startup tied to process.env.
 */
export function validateEnv(environment = process.env) {
  const mongoUri = readRequiredString(environment, "MONGODB_URI");
  const jwtSecret = readRequiredString(environment, "JWT_SECRET");

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new EnvValidationError(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
    );
  }

  const config = {
    port: parsePort(environment.PORT),
    mongoUri,
    jwtSecret,
    clientOrigin: normalizeClientOrigin(environment.CLIENT_ORIGIN),
    dnsServers: parseDnsServers(environment.DNS_SERVERS),
  };

  // Keep environment-style names available to callers that pass the result
  // directly into infrastructure helpers, without making duplicate secrets
  // part of normal object enumeration or serialization.
  Object.defineProperties(config, {
    PORT: { value: config.port, enumerable: false },
    MONGODB_URI: { value: config.mongoUri, enumerable: false },
    JWT_SECRET: { value: config.jwtSecret, enumerable: false },
    CLIENT_ORIGIN: { value: config.clientOrigin, enumerable: false },
    DNS_SERVERS: { value: config.dnsServers, enumerable: false },
  });

  return config;
}

export {
  DEFAULT_CLIENT_ORIGIN,
  DEFAULT_PORT,
  MIN_JWT_SECRET_LENGTH,
};

export default validateEnv;
