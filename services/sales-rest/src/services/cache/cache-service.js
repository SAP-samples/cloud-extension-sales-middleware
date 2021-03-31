
const logger = require('../../logger/console')("CacheService");

class CacheService {
  constructor(cache) {
    this.cache = cache;
  }

  clearCache() {
    logger.info('Flush all from cache');
    return this.cache.flushall();
  }
}
module.exports = {
  factory(cache) {
    return new CacheService(cache);
  },
};
