const { UNAUTHORIZED, FORBIDDEN } = require('http-status-codes');
const { securityErrors } = require('../../constants/errors');

const apiKeyMiddleware = (apiKey) => (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(UNAUTHORIZED).json(securityErrors.MISSING_AUTHENTICATION);
    return;
  }
  if (authorization !== apiKey) {
    res.status(FORBIDDEN).json(securityErrors.FORBIDDEN);
    return;
  }
  next();
};

module.exports = {
  apiKeyMiddleware,
};
