const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../helpers/redis');
const { cache: { keys: { expiration } }, values } = require('../constants/constants');
const { flattenPipelineResponse } = require('../helpers/redis');

const cache  = require('./cache')
const logger = require('../logger/console')("ManagerCacheClient");

const BaseCacheClient = require('./base-cache-client')

class ManagerCacheClient extends BaseCacheClient {
  constructor(cache) {
    super(cache)
    this.cache = cache;
  }

  removeAllKeys() {
    if (!this.cache) {
      return
    }
    this.cache.flushall();
  }

}

module.exports = new ManagerCacheClient(cache.cacheRedis);
