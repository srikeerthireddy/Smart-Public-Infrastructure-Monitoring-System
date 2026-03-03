const jwt = require('jsonwebtoken');

function createHttpError(message, statusCode = 401) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(createHttpError('Missing access token', 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return next(createHttpError('Invalid or expired access token', 401));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(createHttpError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createHttpError('Forbidden', 403));
    }

    return next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
