
class BaseCacheClient {
  constructor(cache) {
    this.cache = cache;
  }

  isEnabled() {
    return this.cache !== undefined
  }
}

module.exports = BaseCacheClient;
