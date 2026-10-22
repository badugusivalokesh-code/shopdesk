import {
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const FORMAT = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const SCRYPT_COST = 2 ** 14;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 32 * 1024 * 1024;

const SCRYPT_OPTIONS = Object.freeze({
  N: SCRYPT_COST,
  r: SCRYPT_BLOCK_SIZE,
  p: SCRYPT_PARALLELIZATION,
  maxmem: SCRYPT_MAX_MEMORY,
});

function assertPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Password must be a non-empty string");
  }
}

function decodeBase64Url(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !/^[A-Za-z0-9_-]+$/.test(value) ||
    value.length % 4 === 1
  ) {
    throw new Error("Invalid password hash encoding");
  }

  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new Error("Invalid password hash encoding");
  }

  return decoded;
}

function parseHash(encodedHash) {
  const parts = encodedHash.split("$");
  if (parts.length !== 4 || parts[0] !== FORMAT) {
    throw new Error("Invalid password hash encoding");
  }

  const parameters = new Map(
    parts[1].split(",").map((parameter) => parameter.split("=")),
  );
  const cost = Number(parameters.get("N"));
  const blockSize = Number(parameters.get("r"));
  const parallelization = Number(parameters.get("p"));

  if (
    !Number.isInteger(cost) ||
    !Number.isInteger(blockSize) ||
    !Number.isInteger(parallelization) ||
    cost < 2 ** 10 ||
    cost > 2 ** 20 ||
    blockSize < 1 ||
    blockSize > 32 ||
    parallelization < 1 ||
    parallelization > 16
  ) {
    throw new Error("Invalid password hash parameters");
  }

  const salt = decodeBase64Url(parts[2]);
  const expectedKey = decodeBase64Url(parts[3]);
  if (salt.length < 16 || salt.length > 64 || expectedKey.length !== KEY_BYTES) {
    throw new Error("Invalid password hash encoding");
  }

  const requiredMemory = 128 * cost * blockSize + 1024;
  if (requiredMemory > SCRYPT_MAX_MEMORY) {
    throw new Error("Invalid password hash parameters");
  }

  return {
    salt,
    expectedKey,
    options: {
      N: cost,
      r: blockSize,
      p: parallelization,
      maxmem: SCRYPT_MAX_MEMORY,
    },
  };
}

async function deriveKey(password, salt, options) {
  return scryptAsync(password, salt, KEY_BYTES, options);
}

/**
 * Hash a password using Node's asynchronous scrypt implementation.
 *
 * The encoded value contains the algorithm parameters, a fresh random salt,
 * and the derived key. It contains no plaintext password material.
 */
export async function hashPassword(password) {
  assertPassword(password);

  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKey(password, salt, SCRYPT_OPTIONS);

  return [
    FORMAT,
    `N=${SCRYPT_COST},r=${SCRYPT_BLOCK_SIZE},p=${SCRYPT_PARALLELIZATION}`,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

/**
 * Verify a password against a hash produced by hashPassword.
 *
 * Invalid encodings deliberately resolve to false rather than exposing
 * parser or crypto details to callers handling login requests.
 */
export async function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || typeof encodedHash !== "string") {
    return false;
  }

  try {
    const { salt, expectedKey, options } = parseHash(encodedHash);
    const derivedKey = await deriveKey(password, salt, options);

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

// These aliases keep the small utility convenient for callers that use
// "compare" or "verify" terminology while keeping the explicit names above
// as the primary API.
export const comparePassword = verifyPassword;
export const hash = hashPassword;
export const verify = verifyPassword;
