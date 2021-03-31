const express = require('express');
const { userControllers } = require('../controllers');
const { server: { baseURL }, authentication: { isXSUAAEnabled } } = require('../constants/constants');
const { registerRoutes } = require('./router-utils');
const { addUserAuthenticationMiddleware } = require('./middleware/user-authentication-middleware');

const routerFactory = applicationContainer => {
  const router = express.Router();
  if (isXSUAAEnabled) {
    addUserAuthenticationMiddleware(baseURL, router, applicationContainer.get('userRepository'));
  }
  registerRoutes(applicationContainer, baseURL, router, userControllers);

  return router;
};

module.exports = {
  factory: routerFactory,
};
