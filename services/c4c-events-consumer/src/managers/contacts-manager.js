const logger = require("../logger/console")("ContactsManager")

class ContactsManager {
  constructor(contactsAPIClient, contactsCache) {
    this.contactsAPIClient = contactsAPIClient;
    this.contactsCache = contactsCache;
  }

  getContactFromSalesCloud(contactObjectID) {
    return this.contactsAPIClient.findContactByObjectID(contactObjectID);
  }
}

module.exports = {
  factory(contactsAPIClient, contactsCache) {
    return new ContactsManager(contactsAPIClient, contactsCache);
  },
};
