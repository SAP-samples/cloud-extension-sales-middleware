const app = require('express')();
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OK } = require('http-status-codes');

const logger = require('../logger/console')("Express Server Init");

const startServer = applicationContainer => {
  applicationContainer.factory({
    eventsRouter: require('../router/events-router').factory,
  });


  // app.use(compression());


  // app.use(
  //   cors({
  //     origin: '*',
  //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //     preflightContinue: false,
  //     optionsSuccessStatus: OK,
  //   }),
  // );
  // app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({ extended: false }));

  app.use((req, res, next) => { //middleware function
    let current_datetime = new Date();
    let formatted_date =
        current_datetime.getFullYear() +
        "-" +
        (current_datetime.getMonth() + 1) +
        "-" +
        current_datetime.getDate() +
        " " +
        current_datetime.getHours() +
        ":" +
        current_datetime.getMinutes() +
        ":" +
        current_datetime.getSeconds();
    let method = req.method;
    let url = req.url;
    let status = res.statusCode;
    logger.debug(`[${formatted_date}] ${method} ${url} ${status}`);
    next();
  });

  app.use((req, res, next) => {
    let data = "";

    req.setEncoding("utf8");
    req.on("data", function (chunk) {
      data += chunk;
    });

    req.on("end", function () {
      req.body = data;
      logger.debug(`New Request Data: ${req.body}`)
      next();
    });
  });

  app.get('/livez', (req, res) => {
    res.sendStatus(200);
  });
  app.get('/readyz', (req, res) => {
    res.sendStatus(200);
  });
  app.get('/healthz', (req, res) => {
    res.sendStatus(200);
  });

  app.use(applicationContainer.get('eventsRouter'));


  return app;
};

module.exports = {
  startServer,
};
