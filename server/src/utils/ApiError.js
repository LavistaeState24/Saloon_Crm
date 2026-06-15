export class ApiError extends Error {
  constructor(statusCode, message, details = null, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.errors = errors;
  }
}
