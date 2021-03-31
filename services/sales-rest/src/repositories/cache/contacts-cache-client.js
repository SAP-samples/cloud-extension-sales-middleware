const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../../helpers/redis');
const logger = require('../../logger/console')("ContactsCacheClient");
const { cache: { keys: { expiration } }, values } = require('../../constants/constants');
const { flattenPipelineResponse } = require('../../helpers/redis');

class ContactsCacheClient {
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

  findContacts() {
    const contactsSetKey = this._buildContactsSetKey();
    logger.info('Fetching cached contacts');
    return this._getContactIdsBy(contactsSetKey)
      .then(contactIds => {
        if (contactIds.cacheHit) {
          return this._getContactsFromCache(contactIds.result)
            .then(tasks => ({ result: tasks, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
  }

  populateContacts(contacts) {
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const contactsSetKey = this._buildContactsSetKey();
      pipeline
        .sadd(contactsSetKey, [values.NO_CONTACTS, ...contacts.map(contact => contact.ObjectID)])
        .expire(contactsSetKey, expiration.contact);
      contacts
        .forEach(contact => {
          const contactKey = this._buildContactKey(contact.ObjectID);
          pipeline
            .hset(contactKey, contact)
            .expire(contactKey, expiration.contact);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return contacts;
  }

  populateContact(contact) {
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

  _getContactsFromCache(contactIds) {
    return contactIds
      .reduce((pipeline, contactId) => pipeline.hgetall(this._buildContactKey(contactId)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  _getContactIdsBy(contactsSetKey) {
    return this
      .cache
      .smembers(contactsSetKey)
      .then(contactIds => {
        if (isEmpty(contactIds)) {
          return { cacheHit: false, result: [] };
        }
        return { cacheHit: true, result: contactIds.filter(contactId => contactId !== values.NO_CONTACTS) };
      });
  }

  _buildContactKey(contactId) {
    return buildCacheKeyFrom({
      type: 'contacts',
      id: contactId,
    });
  }

  _buildContactsSetKey() {
    return buildCacheKeyFrom({
      type: 'contacts',
    });
  }
}

module.exports = {
  factory: (cache) => new ContactsCacheClient(cache),
};
