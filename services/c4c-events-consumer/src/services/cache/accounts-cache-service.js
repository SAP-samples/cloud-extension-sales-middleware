const { BaseCacheService } = require("./base-cache-service")
const logger = require('../../logger/console')("AccountsCacheService");

class AccountsCacheService extends BaseCacheService {
  constructor(accountsManager, accountsCache) {
    super("Account", {
      Root: () => this._root
    })

    this.accountsManager = accountsManager;
    this.accountsCache = accountsCache;
    this.elementHandlers = {
      Root: this._root
    }
  }

  _root = (entityId, eventType) => {
    if (eventType === 'Created') {
      logger.info(`Newly account created not cached: ${entityId}`);
      return new Promise((resolve) => {
        resolve(false);
      });
    } if (eventType === 'Updated') {
      return this.accountsManager.updateAccountInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.accountsCache.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for accounts received: ${eventType}`);
      resolve(false);
    }));
  }

}
module.exports = {
  factory(accountsManager, accountsCache) {
    return new AccountsCacheService(accountsManager, accountsCache);
  },
};
