const Redis = require('ioredis');
const { isEmpty } = require('lodash');
const logger = require('../logger/console')("Cache Init")
const { cache: redis } = require('../constants/constants');

const _createCacheConnection = () => new Redis({
  password: redis.credentials.password,
  port: redis.credentials.port,
  host: redis.credentials.host,
  keyPrefix: redis.keys.namespace,
  //tls: process.env.NODE_ENV === 'production',
  tls: false,
});

const initializeCache = () => {
  if (!redis.isCachingEnabled) {
    logger.warn('Caching is disabled. Skipping cache configuration...');
    return;
  }

  if (isEmpty(redis.credentials)) {
    logger.warn('No cache connection configured. Skipping cache configuration...');
    return;
  }
  logger.warn('Caching is enabled.');
  return _createCacheConnection();
};

const instance = initializeCache()

module.exports = {
  recreateConnection: () => {
    this.cacheRedis = initializeCache()
  },
  cacheRedis: instance
};
