const appContainer = require('./application-container')();
const initialize = require('./initialize');
const initializeCache = require('./cache');

const { initModules } = require('./domain-modules');
const { startServer } = require('./server');

const bootstrapApplication = () =>
    initialize(appContainer)
    .then(() => initializeCache(appContainer))
    .then(() => initModules(appContainer))
    .then(() => startServer(appContainer));

module.exports = {
  bootstrapApplication,
};
