const express = require('express');
const { adminControllers } = require('../controllers');
const { authentication: { adminAPIKey }, server: { adminBaseURL } } = require('../constants/constants');
const { registerRoutes } = require('./router-utils');
const { apiKeyMiddleware } = require('./middleware/api-key-authentication-middleware');

const adminRouterFactory = applicationContainer => {
  const router = express.Router();
  if (adminAPIKey !== undefined && adminAPIKey !== '') {
    router.use(adminBaseURL, apiKeyMiddleware(adminAPIKey));
  }
  registerRoutes(applicationContainer, adminBaseURL, router, adminControllers);

  return router;
};

module.exports = {
  factory: adminRouterFactory,
};
