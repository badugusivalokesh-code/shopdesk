export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CurrentUserResponse {
  user: User;
}

export interface ApiError {
  code?: string;
  details?: string[];
  message?: string;
}

export interface ApiErrorResponse {
  error?: ApiError;
}

export function toSafeUser(value: unknown): User | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.email !== "string" ||
    candidate.id.trim().length === 0 ||
    candidate.name.trim().length === 0 ||
    candidate.email.trim().length === 0
  ) {
    return null;
  }

  return {
    email: candidate.email,
    id: candidate.id,
    name: candidate.name,
  };
}

export function isLoginResponse(value: unknown): value is LoginResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.token === "string" && candidate.token.trim().length > 0 && toSafeUser(candidate.user) !== null;
}

export function isCurrentUserResponse(value: unknown): value is CurrentUserResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return toSafeUser(candidate.user) !== null;
}
