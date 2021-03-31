const mongoose = require('mongoose');
const { database } = require('../constants/constants');
const logger = require('../logger/console')("Database");

const initModels = (appContainer) => {
  const schemas = require('../db/models');
  const models = schemas
    .map((schemaOptions) => ({ ...schemaOptions, model: mongoose.model(schemaOptions.name, schemaOptions.schema) }))
    .reduce((entities, currentEntity) => ({ ...entities, [currentEntity.name]: currentEntity.model }), {});

  appContainer.register({ models });
};

const _buildConnectionOptions = () => {
  const defaultConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  };
  if (process.env.NODE_ENV === 'production') {
    return {
      ...defaultConfig,
      auth: {
        user: process.env.mongo_username,
        password: process.env.mongo_password,
      },
    };
  }
  return defaultConfig;
};

module.exports = (appContainer) => {
  logger.info('Starting database connection...');

  mongoose.connect(database.credentials.uri, _buildConnectionOptions());
  initModels(appContainer);
  return appContainer.register({ db: mongoose });
};
