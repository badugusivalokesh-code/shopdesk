import mongoose from "mongoose";

/**
 * Establishes the MongoDB connection via Mongoose.
 *
 * Phase 1 scope: this function is defined but intentionally NOT called
 * anywhere yet (not from server.js, not from this module). Wiring it up —
 * and actually connecting — is Phase 2 work.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
