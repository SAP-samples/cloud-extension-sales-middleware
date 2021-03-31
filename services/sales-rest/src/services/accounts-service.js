const { convertPaginatedResultsToResponseDTO } = require('../helpers/converters');

class AccountsService {
  constructor(accountsRepository) {
    this.accountsRepository = accountsRepository;
  }

  findAccounts({ filters, pagination }) {
    return this
      .accountsRepository
      .findAccounts({ filters, pagination })
      .then(accountsResponse => convertPaginatedResultsToResponseDTO(accountsResponse, this._buildAccountDTOs));
  }

  findAccountByObjectID(accountObjectId) {
    return this
      .accountsRepository
      .findAccountByObjectID(accountObjectId)
      .then(account => this._buildAccountDTOFrom(account));
  }

  findAccountDetails(accountObjectId) {
    return this
      .accountsRepository
      .findAccountDetails(accountObjectId)
      .then(accountDetails => this._buildAccountDetailsDTOFrom(accountDetails));
  }

  findAccountContacts(accountObjectId) {
    return this
      .accountsRepository
      .findAccountContacts(accountObjectId)
      .then(accountContacts => accountContacts.map(contact => this._accountContactToDTO(contact)));
  }

  _buildAccountDTOs(accounts) {
    return accounts.map(account => ({
      id: account.ObjectID,
      name: account.BusinessPartnerFormattedName,
    }));
  }

  getRatingsList() {
    return this.accountsRepository.getRatingsList()
      .then(ratings => ratings.map(rate => this._buildAccountRateDTO(rate)));
  }

  _buildAccountRateDTO(rate) {
    return {
      code: rate.Code,
      description: rate.Description,
    };
  }

  _buildAccountDTOFrom(account) {
    return {
      id: account.ObjectID,
      name: account.BusinessPartnerFormattedName,
      number: account.AccountID,
      role: account.RoleCodeText,
      rate: account.CustomerABCClassificationCode,
      rateDescription: account.CustomerABCClassificationCodeText,
      address: account.FormattedPostalAddressDescription,
      country: account.CountryCode,
      email: account.Email,
    };
  }

  _buildAccountDetailsDTOFrom(accountDetails) {
    return {
      ...this._buildAccountDTOFrom(accountDetails),
      contact: this._getAccountContact(accountDetails) || null,
    };
  }

  /**
   * for account details, display only one contact:
   * the primary one if exist, otherwise the first contact from the list
   * @param {*} account
   */
  _getAccountContact(account) {
    const accountHasContacts = account.CorporateAccountHasContactPerson;
    if (!accountHasContacts) {
      return null;
    }
    const accountContacts = accountHasContacts.map(accountHasContact => this._accountContactToDTO(accountHasContact));
    const primaryContact = accountContacts.find(contact => contact.isPrimary);
    if (primaryContact) {
      return primaryContact;
    }
    return accountContacts[0];
  }

  _accountContactToDTO(accountHasContact) {
    const { Contact } = accountHasContact;
    return {
      id: Contact.ObjectID,
      name: Contact.Name,
      isPrimary: accountHasContact.MainIndicator,
      jobName: Contact.FunctionCodeText,
      email: Contact.Email,
      phoneNumber: Contact.NormalisedMobile || Contact.NormalisedPhone,
    };
  }
}

module.exports = {
  factory: (accountsRepository) => new AccountsService(accountsRepository),
};
