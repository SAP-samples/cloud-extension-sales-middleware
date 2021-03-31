
const logger = require('../../logger/console')("ContactsCacheService");

class ContactsCacheService {
  constructor(contactsRepository, contactsCacheClient) {
    this.contactsRepository = contactsRepository;
    this.contactsCacheClient = contactsCacheClient;
  }

  updateCacheByEventType({ entityId, eventType }) {
    logger.info(`Sales Cloud CONTACT ${eventType} event received`);
    if (eventType === 'Created') {
      logger.error(`newly created contact not cached: ${entityId}`);
      return new Promise((resolve) => {
        resolve(false);
      });
    } if (eventType === 'Updated') {
      return this._updateContactInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.contactsCacheClient.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for contacts received: ${eventType}`);
      resolve(false);
    }));
  }

  _updateContactInCache(contactId) {
    return this.contactsCacheClient.findContactByUUID(contactId)
      .then(cachedContact => {
        if (cachedContact.cacheHit) {
          logger.info(`Updated contact from Sales Cloud found in cache: ${contactId}`);
          return this.contactsRepository.getContactFromSalesCloud(contactId)
            .then(updatedContact => this.contactsCacheClient.populateInCache(updatedContact));
        }
        logger.info(`Updated contact not found in cache: ${contactId}. Cache not updated`);
        return false;
      });
  }
}
module.exports = {
  factory(contactsRepository, contactsCacheClient) {
    return new ContactsCacheService(contactsRepository, contactsCacheClient);
  },
};
