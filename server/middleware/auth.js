import { verifyJwt } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";

function makeAppError(statusCode, message, code) {
  const error = new AppError(message, statusCode, code);

  // Keep the middleware compatible with the error handler's usual status
  // property names even if its constructor only accepts message/statusCode.
  error.message = message;
  error.status = statusCode;
  error.statusCode = statusCode;
  if (code) {
    error.code = code;
  }

  return error;
}

function getAuthorizationHeader(request) {
  if (typeof request?.get === "function") {
    return request.get("authorization");
  }

  const header = request?.headers?.authorization;
  return Array.isArray(header) ? undefined : header;
}

function getJwtSecret(options) {
  return typeof options === "string" ? options : options?.jwtSecret;
}

/**
 * Build reusable middleware for requests carrying an Authorization Bearer
 * token. Only the claims needed by downstream handlers are copied to req.auth.
 */
export function createAuthMiddleware(options = {}) {
  const jwtSecret = getJwtSecret(options);

  return function authenticate(request, response, next) {
    const authorization = getAuthorizationHeader(request);
    if (typeof authorization !== "string" || authorization.length === 0) {
      return next(
        makeAppError(401, "Authentication required", "AUTH_REQUIRED"),
      );
    }

    const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
    if (!match) {
      return next(makeAppError(401, "Invalid authorization token", "INVALID_TOKEN"));
    }

    try {
      const claims = verifyJwt(match[1], jwtSecret);
      request.auth = {
        sub: claims.sub,
        iat: claims.iat,
        exp: claims.exp,
      };
      return next();
    } catch (error) {
      if (error?.code === "CONFIGURATION_ERROR") {
        return next(
          makeAppError(
            500,
            "Authentication service unavailable",
            "AUTH_CONFIGURATION",
          ),
        );
      }

      return next(makeAppError(401, "Invalid or expired token", "INVALID_TOKEN"));
    }
  };
}

export const requireAuth = createAuthMiddleware;
export const authMiddleware = createAuthMiddleware;
export default createAuthMiddleware;
