const express = require('express');
const { OK } = require('http-status-codes');
const { caiControllers } = require('../controllers');
const { server: { caiBaseURL }, authentication: { isXSUAAEnabled } } = require('../constants/constants');
const { registerRoutes } = require('./router-utils');
const { addUserAuthenticationMiddleware } = require('./middleware/user-authentication-middleware');

const adminRouterFactory = applicationContainer => {
  const router = express.Router();
  if (isXSUAAEnabled) {
    addUserAuthenticationMiddleware(caiBaseURL, router, applicationContainer.get('userRepository'));
  }
  registerRoutes(applicationContainer, caiBaseURL, router, caiControllers);

  // This route is triggered when something bad happened in the builder
  router.post(`${caiBaseURL}/errors`, (req, res) => res.sendStatus(OK));
  router.get(`${caiBaseURL}/status`, (req, res) => res.sendStatus(OK));

  return router;
};

module.exports = {
  factory: adminRouterFactory,
};
