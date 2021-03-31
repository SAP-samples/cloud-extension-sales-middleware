const logger = require('../logger/console')("ContactsRepository");
const { uuidToString } = require('../helpers/converters');

class ContactsRepository {
  constructor(contactsAPIClient, contactsCacheClient) {
    this.contactsAPIClient = contactsAPIClient;
    this.contactsCacheClient = contactsCacheClient;
  }

  findContactByUUID(contactUUID) {
    return this.contactsCacheClient
      .findContactByUUID(uuidToString(contactUUID))
      .then((cachedContact) => {
        if (cachedContact.cacheHit) {
          return cachedContact.result;
        }
        return this.getContactFromSalesCloud(uuidToString(contactUUID))
          .then(contact => this.contactsCacheClient.populateContact(contact))
          .catch(err => {
            logger.error(`Error: ${err.message}`);
            return Promise.reject(err);
          });
      });
  }

  findContactById(contactId) {
    return this.contactsAPIClient.findContactById(contactId);
  }

  findContacts({ filterParams, pagination }) {
    const { name } = filterParams;
    if (name) {
      return this.contactsAPIClient.searchContactsBy({ name, pagination });
    }
    return this.contactsAPIClient.fetchContacts({ pagination });
  }

  getContactFromSalesCloud(contactObjectID) {
    return this.contactsAPIClient.findContactByObjectID(contactObjectID);
  }
}

module.exports = {
  factory(contactsAPIClient, contactsCacheClient) {
    return new ContactsRepository(contactsAPIClient, contactsCacheClient);
  },
};
