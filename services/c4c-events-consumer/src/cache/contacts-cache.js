const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../helpers/redis');
const { cache: { keys: { expiration } } } = require('../constants/constants');
const { sanitize } = require("../helpers/utils")

const logger = require('../logger/console')("ContactsCache");

class ContactsCache {
  constructor(cache) {
    this.cache = cache;
  }

  findContactByUUID(contactId) {
    return this
      .cache
      .hgetall(this._buildContactKey(contactId))
      .then(contact => {
        if (isEmpty(contact)) {
          return { result: {}, cacheHit: false };
        }
        return { result: contact, cacheHit: true };
      });
  }

  populateContact(contact) {
    contact = sanitize(contact)
    const contactCacheKey = this._buildContactKey(contact.ObjectID);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .hset(contactCacheKey, contact)
        .expire(contactCacheKey, expiration.contact);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return contact;
  }

  deleteFromCache(contactId) {
    return this
      .findContactByUUID(contactId)
      .then(cachedContact => {
        if (cachedContact.cacheHit) {
          logger.info(`Deleted contact from cache with ID: ${contactId}`);
          return this
            .cache
            .del(this._buildContactKey(contactId));
        }
        return Promise.resolve();
      });
  }

  _buildContactKey(contactId) {
    return buildCacheKeyFrom({
      type: 'contacts',
      id: contactId,
    });
  }
}

module.exports = {
  factory: (cache) => new ContactsCache(cache),
};
