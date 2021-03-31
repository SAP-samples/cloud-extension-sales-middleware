const { BaseCacheService } = require("./base-cache-service")
const logger = require('../../logger/console')("ContactsCacheService");

class ContactsCacheService extends BaseCacheService {
  constructor(contactsManager, contactsCache) {
    super("Contact", {
      Root: () => this._root
    })

    this.contactsManager = contactsManager;
    this.contactsCache = contactsCache;
  }

  _root = (entityId, eventType) => {
    if (eventType === 'Created') {
      logger.error(`newly created contact not cached: ${entityId}`);
      return new Promise((resolve) => {
        resolve(false);
      });
    } if (eventType === 'Updated') {
      return this._updateContactInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.contactsCache.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for contacts received: ${eventType}`);
      resolve(false);
    }));
  }

  _updateContactInCache(contactId) {
    return this.contactsCache.findContactByUUID(contactId)
      .then(cachedContact => {
        if (cachedContact.cacheHit) {
          logger.info(`Updated contact from Sales Cloud found in cache: ${contactId}`);
          return this.contactsManager.getContactFromSalesCloud(contactId)
            .then(updatedContact => this.contactsCache.populateInCache(updatedContact));
        }
        logger.info(`Updated contact not found in cache: ${contactId}. Cache not updated`);
        return false;
      });
  }
}
module.exports = {
  factory(contactsManager, contactsCache) {
    return new ContactsCacheService(contactsManager, contactsCache);
  },
};
