/**
 * Custom error classes for OpenRouter Service
 * These are exported for use in API endpoints and error handling
 */

/**
 * Thrown when the service cannot be initialized due to missing or invalid
 * configuration (e.g., missing OPENROUTER_API_KEY environment variable)
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Base class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Thrown for 401 Unauthorized responses (invalid or missing API key)
 */
export class ApiAuthenticationError extends ApiError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401);
    Object.setPrototypeOf(this, ApiAuthenticationError.prototype);
  }
}

/**
 * Thrown for 400 Bad Request responses (malformed request)
 */
export class ApiBadRequestError extends ApiError {
  constructor(message = "Invalid request format or parameters", response?: unknown) {
    super(message, 400, response);
    Object.setPrototypeOf(this, ApiBadRequestError.prototype);
  }
}

/**
 * Thrown for 429 Too Many Requests responses (rate limited)
 */
export class ApiRateLimitError extends ApiError {
  constructor(message = "Rate limit exceeded. Please try again later.", response?: unknown) {
    super(message, 429, response);
    Object.setPrototypeOf(this, ApiRateLimitError.prototype);
  }
}

/**
 * Thrown for 5xx server errors from the OpenRouter API
 */
export class ApiServerError extends ApiError {
  constructor(message = "OpenRouter API server error", statusCode = 500, response?: unknown) {
    super(message, statusCode, response);
    Object.setPrototypeOf(this, ApiServerError.prototype);
  }
}

/**
 * Thrown for network-level errors (timeouts, DNS failures, etc.)
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Thrown when the API response cannot be parsed or doesn't match the
 * provided JSON schema
 */
export class ResponseParsingError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = "ResponseParsingError";
    Object.setPrototypeOf(this, ResponseParsingError.prototype);
  }
}
