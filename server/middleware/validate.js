const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Error used by request validation middleware. The error handler recognizes
 * the stable code and returns a 400 response.
 */
export class ValidationError extends Error {
  constructor(message = "Request validation failed", details = []) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
    this.statusCode = 400;
    this.details = details;
  }
}

/**
 * Basic email validation shared by authentication routes.
 */
export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_PATTERN.test(value.trim());
}

// Common aliases keep the helper convenient for route modules without
// requiring them to duplicate an email regular expression.
export const validateEmail = isValidEmail;
export const isEmail = isValidEmail;

function describeRuleFailure(field, rule) {
  if (typeof rule === "string") {
    return rule;
  }

  if (rule && typeof rule.message === "string") {
    return rule.message;
  }

  return `${field} is invalid`;
}

function checkRule(field, value, rule, body) {
  if (typeof rule === "function") {
    const result = rule(value, body);

    if (
      result === true ||
      result === undefined ||
      (result && typeof result === "object" && result.valid === true)
    ) {
      return null;
    }

    return describeRuleFailure(field, result);
  }

  if (typeof rule === "string") {
    return value === rule ? null : describeRuleFailure(field, rule);
  }

  if (!rule || typeof rule !== "object") {
    return null;
  }

  if (rule.type && typeof value !== rule.type) {
    return `${field} must be a ${rule.type}`;
  }

  if (rule.minLength !== undefined && value.length < rule.minLength) {
    return `${field} must be at least ${rule.minLength} characters long`;
  }

  if (rule.maxLength !== undefined && value.length > rule.maxLength) {
    return `${field} must be at most ${rule.maxLength} characters long`;
  }

  if (rule.pattern && !rule.pattern.test(value)) {
    return describeRuleFailure(field, rule);
  }

  const validator = rule.validate ?? rule.validator;

  if (typeof validator === "function") {
    const result = validator(value, body);

    if (result !== true && result !== undefined) {
      return typeof result === "string"
        ? result
        : describeRuleFailure(field, rule);
    }
  }

  return null;
}

function collectValidationErrors(body, schema) {
  if (typeof schema === "function") {
    const result = schema(body);

    if (result === true || result === undefined || result === null) {
      return [];
    }

    if (Array.isArray(result)) {
      return result;
    }

    if (typeof result === "string") {
      return [result];
    }

    if (result && Array.isArray(result.errors)) {
      return result.errors;
    }

    if (result && typeof result === "object") {
      return Object.entries(result).flatMap(([field, message]) => {
        if (message === false || message === true || message === undefined) {
          return message === false ? [`${field} is invalid`] : [];
        }

        return [typeof message === "string" ? message : `${field} is invalid`];
      });
    }

    return ["Request body is invalid"];
  }

  if (Array.isArray(schema)) {
    return schema
      .filter((field) => typeof field === "string")
      .filter((field) => body[field] === undefined || body[field] === null || body[field] === "")
      .map((field) => `${field} is required`);
  }

  if (!schema || typeof schema !== "object") {
    return [];
  }

  const errors = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = body[field];
    const required =
      rule && typeof rule === "object" && !Array.isArray(rule)
        ? rule.required === true
        : false;
    const missing = value === undefined || value === null || value === "";

    if (missing) {
      if (required) {
        errors.push(`${field} is required`);
      }
      continue;
    }

    const failure = checkRule(field, value, rule, body);

    if (failure) {
      errors.push(failure);
    }
  }

  return errors;
}

/**
 * Create reusable Express middleware for validating a JSON request body.
 *
 * Supported schemas are intentionally small: an array of required field
 * names, a field-to-rule object, or a function receiving the full body.
 */
export function validateBody(schema = {}) {
  return function bodyValidationMiddleware(request, response, next) {
    const body = request.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      next(new ValidationError("Request body must be a JSON object"));
      return;
    }

    const errors = collectValidationErrors(body, schema);

    if (errors.length > 0) {
      next(new ValidationError("Request validation failed", errors));
      return;
    }

    next();
  };
}

export const validateRequestBody = validateBody;

export default validateBody;
