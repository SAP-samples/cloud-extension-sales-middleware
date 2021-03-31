const { isEmpty } = require('lodash');
const { convertPaginatedResultsToResponseDTO } = require('../helpers/converters');

class ContactsService {
  constructor(contactsRepository) {
    this.contactsRepository = contactsRepository;
  }

  findContactByUUID(contactUUID) {
    return this
      .contactsRepository
      .findContactByUUID(contactUUID)
      .then(contact => this._buildContactDTO(contact));
  }

  findContactById(contactId) {
    return this
      .contactsRepository
      .findContactById(contactId)
      .then(contactList => {
        if (isEmpty(contactList)) {
          return null;
        }
        return this._buildContactDTO(contactList[0]);
      });
  }

  findContacts({ filterParams, pagination }) {
    return this
      .contactsRepository
      .findContacts({ filterParams, pagination })
      .then((contactsResponse) => convertPaginatedResultsToResponseDTO(contactsResponse, this._buildContactDTOs));
  }

  _buildContactDTOs(contacts) {
    return contacts.map(contact => ({
      id: contact.ObjectID,
      name: contact.Name,
    }));
  }

  _buildContactDTO(contact) {
    return {
      id: contact.ObjectID,
      name: contact.Name,
      companyName: contact.AccountFormattedName,
      department: contact.DepartmentCodeText,
      phoneNumber: contact.NormalisedMobile || contact.NormalisedPhone,
      jobName: contact.FunctionCodeText,
      location: contact.FormattedPostalAddressDescription,
      email: contact.Email,
    };
  }
}

module.exports = {
  factory(contactsRepository) {
    return new ContactsService(contactsRepository);
  },
};
