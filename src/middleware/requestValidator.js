const ValidationError = require('../errors/ValidationError');

/**
 * Request validator middleware
 * Validates request method, content type, and basic structure
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestValidator = (req, res, next) => {
  try {
    // Validate request method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(req.method)) {
      throw new ValidationError(
        `Invalid HTTP method: ${req.method}`,
        'INVALID_METHOD'
      );
    }

    // For POST and PUT requests, validate Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');

      if (!contentType || !contentType.includes('application/json')) {
        throw new ValidationError(
          'Invalid Content-Type. Expected: application/json',
          'INVALID_CONTENT_TYPE'
        );
      }

      // Validate request body exists for mutation operations
      if (!req.body || Object.keys(req.body).length === 0) {
        throw new ValidationError(
          'Request body cannot be empty',
          'EMPTY_BODY'
        );
      }
    }

    // Validate URL path is not empty
    if (!req.path || req.path.length === 0) {
      throw new ValidationError(
        'Invalid request path',
        'INVALID_PATH'
      );
    }

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(error.getStatusCode()).json(error.toJSON());
    }
    next(error);
  }
};

module.exports = requestValidator;
