const { isEmpty } = require('lodash');
const {
  cache: { keys: { expiration } },
} = require('../constants/constants');
const { buildCacheKeyFrom } = require('../helpers/redis');
const logger = require('../logger/console')("AccountsCacheClient");
const cache  = require('./cache')
const BaseCacheClient = require('./base-cache-client')

class AccountsCacheClient extends BaseCacheClient {

  constructor(cache) {
    super(cache)
    this.cache = cache;
  }

  findAccountByObjectID(accountUUID) {
    if (!this.cache) {
      return new Promise((resolve, reject) => {
        return resolve({ cacheHit: false });
      })
    }
    return this
      .cache
      .hgetall(this._buildAccountKey(accountUUID))
      .then(account => {
        if (isEmpty(account)) {
          return { cacheHit: false };
        }
        logger.info(`Getting cached account: ${accountUUID}`);
        return { result: account, cacheHit: true };
      });
  }

  _buildAccountKey(accountId) {
    return buildCacheKeyFrom({
      id: accountId,
      type: 'accounts',
    });
  }

  populateInCache(account) {
    if (!this.cache) {
      return account
    }
    logger.info(`Cache account: ${account.ObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const accountKey = this._buildAccountKey(account.ObjectID);
      pipeline
        .hset(accountKey, account)
        .expire(accountKey, expiration.account)
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return account;
  }

  deleteFromCache(accountUUID) {
    return this
      .findAccountByObjectID(accountUUID)
      .then(cachedAccount => {
        if (cachedAccount.cacheHit) {
          logger.info(`Deleted account from cache with UUID: ${accountUUID}`);
          return this
            .cache
            .del(this._buildAccountKey(accountUUID));
        }
        return Promise.resolve();
      });
  }
}

module.exports = new AccountsCacheClient(cache.cacheRedis);
