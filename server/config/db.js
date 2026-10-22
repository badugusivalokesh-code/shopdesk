import mongoose from "mongoose";

/**
 * Return the URI from either a normalized config object or a direct string.
 * Falling back to process.env keeps this helper useful on its own while the
 * server bootstrap passes validated configuration explicitly.
 */
function resolveMongoUri(configOrUri) {
  if (typeof configOrUri === "string") {
    return configOrUri.trim();
  }

  if (configOrUri && typeof configOrUri === "object") {
    return String(
      configOrUri.mongoUri ?? configOrUri.mongodbUri ?? configOrUri.MONGODB_URI ?? "",
    ).trim();
  }

  return typeof process.env.MONGODB_URI === "string"
    ? process.env.MONGODB_URI.trim()
    : "";
}

/**
 * Establish the MongoDB connection via Mongoose.
 *
 * Errors deliberately propagate to the caller so startup can stop rather
 * than serving an API that has not established its database dependency.
 */
export async function connectDB(configOrUri) {
  const uri = resolveMongoUri(configOrUri);

  if (!uri) {
    throw new Error("MONGODB_URI must be set before connecting to MongoDB");
  }

  return mongoose.connect(uri);
}

/**
 * Return a public, non-secret view of the current Mongoose connection state.
 */
export function getDatabaseStatus() {
  const stateNames = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const readyState = mongoose.connection.readyState;

  return {
    status: stateNames[readyState] ?? "unknown",
    readyState,
  };
}
