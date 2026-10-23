import express from "express";

import User from "../models/User.js";
import { createAuthMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validate.js";
import { hashPassword } from "../utils/password.js";

const SUPPORTED_FIELDS = new Set(["name", "password"]);

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

function hasOwnField(body, field) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function validateUserUpdateBody(body) {
  const errors = [];
  const unexpectedKeys = Object.keys(body).filter(
    (key) => !SUPPORTED_FIELDS.has(key),
  );
  const hasName = hasOwnField(body, "name");
  const hasPassword = hasOwnField(body, "password");

  if (unexpectedKeys.length > 0) {
    errors.push("request body may only contain name and password");
  }

  if (!hasName && !hasPassword) {
    errors.push("at least one of name or password is required");
  }

  if (
    hasName &&
    (typeof body.name !== "string" || body.name.trim().length === 0)
  ) {
    errors.push("name must be a non-empty string");
  }

  if (
    hasPassword &&
    (typeof body.password !== "string" || body.password.length < 8)
  ) {
    errors.push("password must be a string of at least 8 characters");
  }

  return errors;
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
    name: user?.name,
    email: user?.email,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };
}

/**
 * Create the authenticated user router without reading environment variables
 * or opening a database connection.
 */
export function createUserRouter({ jwtSecret } = {}) {
  const router = express.Router();
  const authenticate = createAuthMiddleware({ jwtSecret });

  router.use(authenticate);

  router.put(
    "/me",
    validateBody(validateUserUpdateBody),
    async (request, response, next) => {
      try {
        const update = {};

        if (hasOwnField(request.body, "name")) {
          update.name = request.body.name.trim();
        }

        if (hasOwnField(request.body, "password")) {
          update.passwordHash = await hashPassword(request.body.password);
        }

        const query = User.findByIdAndUpdate(
          request.auth.sub,
          { $set: update },
          { new: true, runValidators: true },
        );
        const selectedQuery =
          query && typeof query.select === "function"
            ? query.select("name email createdAt updatedAt")
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
          return next(
            makeAppError(401, "Invalid authentication token", "INVALID_TOKEN"),
          );
        }

        return next(error);
      }
    },
  );

  return router;
}

export default createUserRouter;
