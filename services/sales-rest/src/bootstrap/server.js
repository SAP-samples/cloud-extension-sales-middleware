const app = require('express')();
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OK } = require('http-status-codes');
const swaggerUi = require('swagger-ui-express');
const logger = require('../logger/console')("Express Server");
const openApiDocumentation = require('../controllers/user/openAPI/openAPIDocumentation.json');
const { authentication: { isXSUAAEnabled, fakeUserId } } = require('../constants/constants');

const startServer = applicationContainer => {
  // app.use(logger.logNetwork);
  app.use(compression());
  applicationContainer.factory({
    userRouter: require('../router/user-router').factory,
    adminRouter: require('../router/admin-router').factory,
    caiRouter: require('../router/cai-router').factory,
  });

  app.use(
    cors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: OK,
    }),
  );

  if (!isXSUAAEnabled) {
    logger.warn('XSUAA is disabled.')
    app.use('/', (req, res, next) => {
      if (!req.authInfo) {
        req.authInfo = {};
      }
      req.authInfo.salesCloudUserId = fakeUserId;

      next();
    });
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(applicationContainer.get('adminRouter'));
  app.use(applicationContainer.get('userRouter'));
  app.use(applicationContainer.get('caiRouter'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));
  return app;
};

module.exports = {
  startServer,
};
