const AppError = require('../errors/AppError');

/**
 * Authentication middleware to verify Bearer token
 * All endpoints require Bearer token authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists
    if (!authHeader) {
      throw new AppError(
        'Authorization header is missing',
        401,
        'UNAUTHORIZED'
      );
    }

    // Check if header follows Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(
        'Invalid authorization header format. Expected: Bearer <token>',
        401,
        'UNAUTHORIZED'
      );
    }

    const token = parts[1];

    // Validate token is not empty
    if (!token || token.trim().length === 0) {
      throw new AppError(
        'Token is empty',
        401,
        'UNAUTHORIZED'
      );
    }

    // Attach token to request object for later use
    req.token = token;
    req.user = {
      authenticated: true,
      token: token,
      timestamp: new Date(),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.getStatusCode()).json(error.toJSON());
    }
    next(error);
  }
};

module.exports = authMiddleware;
