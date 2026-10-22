/**
 * Application error with a client-safe status and error code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.code === "11000";
}

function isValidationError(error) {
  return (
    error?.code === "VALIDATION_ERROR" ||
    error?.name === "ValidationError" ||
    error?.name === "CastError" ||
    error?.type === "entity.parse.failed"
  );
}

function validationMessage(error) {
  if (error?.type === "entity.parse.failed") {
    return "Request body must contain valid JSON";
  }

  // Messages from our own validation middleware are intentionally safe to
  // return. Mongoose's generated messages can contain implementation details,
  // so those use a stable generic message instead.
  if (error?.code === "VALIDATION_ERROR" && typeof error.message === "string") {
    return error.message;
  }

  return "Request validation failed";
}

function normalizeStatusCode(statusCode) {
  return Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
    ? statusCode
    : 500;
}

/**
 * Express error middleware. Every response has the same public shape and
 * unknown failures never expose a stack, raw error, or database details.
 */
export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(normalizeStatusCode(error.statusCode)).json({
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message,
      },
    });
    return;
  }

  if (isDuplicateKeyError(error)) {
    response.status(409).json({
      error: {
        code: "DUPLICATE_KEY",
        message: "A resource with those details already exists",
      },
    });
    return;
  }

  if (isValidationError(error)) {
    const validationResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: validationMessage(error),
      },
    };

    if (Array.isArray(error?.details) && error.details.length > 0) {
      validationResponse.error.details = error.details;
    }

    response.status(400).json(validationResponse);
    return;
  }

  // Keep server-side logging useful without echoing a potentially sensitive
  // error message or stack trace into a response or log sink by default.
  const errorName = typeof error?.name === "string" ? error.name : "Error";
  console.error(`[ShopDesk] Unhandled ${errorName}`);

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
  });
}

export default errorHandler;
