function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
}

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};