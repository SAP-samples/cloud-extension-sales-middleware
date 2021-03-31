const Redis = require('ioredis');
const { isEmpty } = require('lodash');
const logger = require('../logger/console')("Redis");
const { cache } = require('../constants/constants');

const _createCacheConnection = () => new Redis({
  password: cache.credentials.password,
  port: cache.credentials.port,
  host: cache.credentials.host,
  keyPrefix: cache.keys.namespace,
  //tls: process.env.NODE_ENV === 'production',
  tls: false,
});

const initializeCache = (appContainer) => {
  if (isEmpty(cache.credentials)) {
    logger.error('No cache connection configured.');
    return Promise.reject(Error('No cache connection configured.'));
  }
  return appContainer.register({
    cache: _createCacheConnection(),
  });
};

module.exports = initializeCache;
