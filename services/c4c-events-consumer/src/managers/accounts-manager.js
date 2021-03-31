const logger = require("./../logger/console")("AccountsManager")

class AccountsManager {
  constructor(accountsAPIClient, accountsCache) {
    this.accountsAPIClient = accountsAPIClient;
    this.accountsCache = accountsCache;
  }

  updateAccountInCache(accountObjectID) {
    return this.accountsCache.findAccountByObjectID(accountObjectID)
      .then(cachedAccount => {
        if (cachedAccount.cacheHit) {
          logger.info(`Updated account from Sales Cloud found in cache: ${accountObjectID}`);
          return this
            .accountsAPIClient
            .findAccountByObjectID(accountObjectID)
            .then(updatedAccount => this.accountsCache.populateInCache(updatedAccount));
        }
        logger.info(`Updated account not found in cache: ${accountObjectID}. Cache not updated`);
        return false;
      });
  }
}
module.exports = {
  factory(accountsAPIClient, accountsCache) {
    return new AccountsManager(accountsAPIClient, accountsCache);
  },
};
