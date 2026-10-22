import express from "express";

import User from "../models/User.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { isValidEmail, validateBody } from "../middleware/validate.js";
import { createJwt } from "../utils/jwt.js";
import { verifyPassword } from "../utils/password.js";

const loginBodySchema = {
  email: {
    required: true,
    type: "string",
    validate: (value) => isValidEmail(value) || "email must be a valid email address",
  },
  password: {
    minLength: 1,
    required: true,
    type: "string",
  },
};

function makeAppError(statusCode, message, code) {
  const error = new AppError(message, statusCode, code);
  error.message = message;
  error.status = statusCode;
  error.statusCode = statusCode;
  if (code) {
    error.code = code;
  }
  return error;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getUserId(user) {
  if (user?._id !== undefined && user?._id !== null) {
    return String(user._id);
  }

  if (user?.id !== undefined && user?.id !== null) {
    return String(user.id);
  }

  return "";
}

function toSafeUser(user) {
  return {
    id: getUserId(user),
    name: user.name,
    email: user.email,
  };
}

/**
 * Create the authentication router without reading environment variables or
 * opening a database connection. The application supplies its JWT secret.
 */
export function createAuthRouter({ jwtSecret } = {}) {
  const router = express.Router();
  const authenticate = createAuthMiddleware({ jwtSecret });

  router.post("/login", validateBody(loginBodySchema), async (request, response, next) => {
    const email = normalizeEmail(request.body.email);
    const { password } = request.body;

    try {
      const query = User.findOne({ email });
      const selectedQuery =
        query && typeof query.select === "function"
          ? query.select("+passwordHash")
          : query;
      const user = await selectedQuery;
      const passwordMatches = user
        ? await verifyPassword(password, user.passwordHash)
        : false;

      if (!user || !passwordMatches) {
        return next(makeAppError(401, "Invalid email or password", "INVALID_CREDENTIALS"));
      }

      const safeUser = toSafeUser(user);
      const token = createJwt({ sub: safeUser.id }, jwtSecret);

      return response.json({ token, user: safeUser });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", authenticate, async (request, response, next) => {
    try {
      const query = User.findById(request.auth.sub);
      const selectedQuery =
        query && typeof query.select === "function"
          ? query.select("name email")
          : query;
      const user = await selectedQuery;

      if (!user) {
        return next(makeAppError(404, "User not found", "USER_NOT_FOUND"));
      }

      return response.json({ user: toSafeUser(user) });
    } catch (error) {
      // A validly signed token with an unusable subject is an authentication
      // failure, while database failures remain unexpected 500s.
      if (error?.name === "CastError") {
        return next(makeAppError(401, "Invalid authentication token", "INVALID_TOKEN"));
      }

      return next(error);
    }
  });

  return router;
}

export default createAuthRouter;
