const express = require('express');
const { eventControllers } = require('../controllers');
const { server: { eventsBaseURL } } = require('../constants/constants');
const { registerRoutes } = require('./router-utils');

const adminRouterFactory = applicationContainer => {
    const router = express.Router();
    registerRoutes(applicationContainer, eventsBaseURL, router, eventControllers);

    return router;
};

module.exports = {
    factory: adminRouterFactory,
};
