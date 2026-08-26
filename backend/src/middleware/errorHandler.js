/**
 * Shared errors and the final Express error middleware.
 *
 * Controllers never write error JSON themselves — they `next(err)`.
 * Every error response is `{ error: { code, message, details? } }` so the
 * React client can show `error.message` consistently.
 */

/**
 * Application error with an HTTP status and machine-readable code.
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {unknown} [details]
 */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** @param {string} [message] */
export function notFound(message = 'Resource not found') {
  return new HttpError(404, 'NOT_FOUND', message);
}

/**
 * @param {string} message
 * @param {unknown} [details]
 */
export function badRequest(message, details) {
  return new HttpError(400, 'VALIDATION_ERROR', message, details);
}

/** Fallback for unmatched routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}`,
    },
  });
}

/**
 * Express 4-arg error handler. Maps HttpError and JSON parse failures;
 * everything else becomes a generic 500.
 */
export function errorHandler(err, req, res, next) {
  // If a handler already started the response, we cannot send JSON safely.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Request body is not valid JSON',
      },
    });
    return;
  }

  // Do not leak stack traces to the client.
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
