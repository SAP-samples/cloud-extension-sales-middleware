
const logger = require('../../logger/console')("AccountsCacheService");

class AccountsCacheService {
  constructor(accountsRepository, accountsCacheClient) {
    this.accountsRepository = accountsRepository;
    this.accountsCacheClient = accountsCacheClient;
  }

  updateCacheByEventType({ entityId, eventType }) {
    logger.info(`Sales Cloud ACCOUNT ${eventType} event received`);
    if (eventType === 'Created') {
      logger.info(`Newly account created not cached: ${entityId}`);
      return new Promise((resolve) => {
        resolve(false);
      });
    } if (eventType === 'Updated') {
      return this.accountsRepository.updateAccountInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.accountsCacheClient.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for accounts received: ${eventType}`);
      resolve(false);
    }));
  }
}
module.exports = {
  factory(accountsRepository, accountsCacheClient) {
    return new AccountsCacheService(accountsRepository, accountsCacheClient);
  },
};
