const appContainer = require('./application-container')();
const initializeDB = require('./db');
const initializeCache = require('./cache');
const initModules = require('./domain-modules');
const { startServer } = require('./server');
const initialize = require('./initialize');

const bootstrapApplication = () =>
    initialize(appContainer)
    .then(() => initializeCache(appContainer))
    .then(() => initializeDB(appContainer))
    .then(() => initModules(appContainer))
    .then(() => startServer(appContainer));

module.exports = {
  bootstrapApplication,
};
