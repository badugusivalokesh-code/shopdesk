import { createHmac, timingSafeEqual } from "node:crypto";

const ALGORITHM = "HS256";
const TOKEN_TYPE = "JWT";
const DEFAULT_EXPIRES_IN_SECONDS = 24 * 60 * 60;
const SIGNATURE_BYTES = 32;

export class JwtError extends Error {
  constructor(message = "Invalid token", code = "INVALID_TOKEN", statusCode = 401) {
    super(message);
    this.name = "JwtError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function configurationError(message) {
  return new JwtError(message, "CONFIGURATION_ERROR", 500);
}

function invalidToken(message = "Invalid token", code = "INVALID_TOKEN") {
  return new JwtError(message, code, 401);
}

function assertSecret(secret) {
  const isBuffer = Buffer.isBuffer(secret);
  if (
    (!isBuffer && typeof secret !== "string") ||
    secret.length === 0
  ) {
    throw configurationError("JWT secret is not configured");
  }
}

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeSegment(segment) {
  if (
    typeof segment !== "string" ||
    segment.length === 0 ||
    !/^[A-Za-z0-9_-]+$/.test(segment) ||
    segment.length % 4 === 1
  ) {
    throw invalidToken();
  }

  const decoded = Buffer.from(segment, "base64url");
  if (decoded.toString("base64url") !== segment) {
    throw invalidToken();
  }

  return decoded;
}

function decodeJsonSegment(segment) {
  try {
    return JSON.parse(decodeSegment(segment).toString("utf8"));
  } catch (error) {
    if (error instanceof JwtError) {
      throw error;
    }
    throw invalidToken();
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeSubject(subject) {
  if (typeof subject === "string" && subject.length > 0) {
    return subject;
  }

  if (typeof subject === "number" && Number.isFinite(subject)) {
    return String(subject);
  }

  throw invalidToken("Token subject is required", "INVALID_CLAIMS");
}

function normalizeExpiresIn(value) {
  if (value === undefined) {
    return DEFAULT_EXPIRES_IN_SECONDS;
  }

  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (match) {
      const amount = Number(match[1]);
      const multiplier = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 24 * 60 * 60,
      }[match[2]];
      const seconds = amount * multiplier;
      if (Number.isSafeInteger(seconds) && seconds > 0) {
        return seconds;
      }
    }
  }

  throw invalidToken("Invalid token lifetime", "INVALID_CLAIMS");
}

function normalizeClaimDate(value, claimName) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw invalidToken(`Invalid ${claimName} claim`, "INVALID_CLAIMS");
  }

  return value;
}

function normalizeCreateArguments(payloadOrSubject, options) {
  let payload;
  if (typeof payloadOrSubject === "string" || typeof payloadOrSubject === "number") {
    payload = { sub: String(payloadOrSubject) };
  } else if (isObject(payloadOrSubject)) {
    payload = { ...payloadOrSubject };
  } else {
    throw invalidToken("Token subject is required", "INVALID_CLAIMS");
  }

  const normalizedOptions =
    typeof options === "number" || typeof options === "string"
      ? { expiresIn: options }
      : isObject(options)
        ? options
        : {};

  return { payload, options: normalizedOptions };
}

/**
 * Create a signed HS256 JWT. The payload must contain a subject; issued-at
 * and expiration claims are added when they are not supplied by the caller.
 */
export function createJwt(payloadOrSubject, secret, options) {
  assertSecret(secret);

  const { payload, options: normalizedOptions } = normalizeCreateArguments(
    payloadOrSubject,
    options,
  );
  const now = Math.floor(Date.now() / 1000);
  const iat =
    payload.iat === undefined ? now : normalizeClaimDate(payload.iat, "iat");
  const expiresIn = normalizeExpiresIn(normalizedOptions.expiresIn);
  const exp =
    payload.exp === undefined
      ? iat + expiresIn
      : normalizeClaimDate(payload.exp, "exp");

  const normalizedPayload = {
    ...payload,
    sub: normalizeSubject(payload.sub),
    iat,
    exp,
  };
  const encodedHeader = encodeSegment({ alg: ALGORITHM, typ: TOKEN_TYPE });
  const encodedPayload = encodeSegment(normalizedPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

/**
 * Verify an HS256 JWT and return its claims. Signature validation happens
 * before claim validation so malformed or forged tokens receive safe errors.
 */
export function verifyJwt(token, secret) {
  assertSecret(secret);

  if (typeof token !== "string") {
    throw invalidToken();
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw invalidToken();
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonSegment(encodedHeader);
  if (
    !isObject(header) ||
    header.alg !== ALGORITHM ||
    (header.typ !== undefined && header.typ !== TOKEN_TYPE)
  ) {
    throw invalidToken();
  }

  const suppliedSignature = decodeSegment(encodedSignature);
  const expectedSignature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  if (
    suppliedSignature.length !== SIGNATURE_BYTES ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    throw invalidToken();
  }

  const payload = decodeJsonSegment(encodedPayload);
  if (!isObject(payload)) {
    throw invalidToken();
  }

  const sub = normalizeSubject(payload.sub);
  const iat = normalizeClaimDate(payload.iat, "iat");
  const exp = normalizeClaimDate(payload.exp, "exp");
  const now = Math.floor(Date.now() / 1000);
  if (exp <= now) {
    throw invalidToken("Token has expired", "TOKEN_EXPIRED");
  }

  return {
    ...payload,
    sub,
    iat,
    exp,
  };
}

export const createToken = createJwt;
export const signToken = createJwt;
export const verifyToken = verifyJwt;
export const verifyJwtToken = verifyJwt;
