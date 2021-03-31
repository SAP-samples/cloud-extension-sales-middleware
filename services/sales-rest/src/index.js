const logger = require('./logger/console')("Main");

const {
  server: { port },
} = require('./constants/constants');

require('./helpers/proto');
require('./bootstrap')
  .bootstrapApplication()
  .then(server => server.listen(port))
  .then(() => logger.info(`The application is up on port ${port}`));
