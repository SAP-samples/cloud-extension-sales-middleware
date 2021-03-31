const logger = require('../logger/console')("AccountsRepository");
const { uuidToString } = require('./../helpers/converters');

class AccountsRepository {
  constructor(accountsAPIClient, accountsCacheClient) {
    this.accountsAPIClient = accountsAPIClient;
    this.accountsCacheClient = accountsCacheClient;
  }

  findAccountByObjectID(accountUUID) {
    const accountObjectID = uuidToString(accountUUID);
    return this
      .accountsCacheClient
      .findAccountByObjectID(accountObjectID)
      .then((cachedAccount) => {
        if (cachedAccount.cacheHit) {
          return cachedAccount.result;
        }
        return this
          .accountsAPIClient
          .findAccountByObjectID(accountObjectID)
          .then(account => this.accountsCacheClient.populateInCache(account))
          .catch(err => {
            logger.error(`Error: ${err.message}`);
            return Promise.reject(err);
          });
      });
  }

  findAccountDetails(accountUUID) {
    const accountObjectID = uuidToString(accountUUID);
    return this
      .accountsAPIClient
      .findAccountDetails(accountObjectID);
  }

  findAccounts({ filters, pagination }) {
    const { name } = filters;
    if (name) {
      return this.accountsAPIClient.searchAccountsBy({ name, pagination });
    }
    return this.accountsAPIClient.fetchAccounts({ pagination });
  }

  findAccountContacts(accountObjectID) {
    return this.accountsAPIClient.fetchAccountContacts(accountObjectID);
  }

  getRatingsList() {
    return this.accountsAPIClient.fetchAccountsRatingList();
  }

  updateAccountInCache(accountObjectID) {
    return this.accountsCacheClient.findAccountByObjectID(accountObjectID)
      .then(cachedAccount => {
        if (cachedAccount.cacheHit) {
          logger.info(`Updated account from Sales Cloud found in cache: ${accountObjectID}`);
          return this
            .accountsAPIClient
            .findAccountByObjectID(accountObjectID)
            .then(updatedAccount => this.accountsCacheClient.populateInCache(updatedAccount));
        }
        logger.info(`Updated account not found in cache: ${accountObjectID}. Cache not updated`);
        return false;
      });
  }
}
module.exports = {
  factory(accountsAPIClient, accountsCacheClient) {
    return new AccountsRepository(accountsAPIClient, accountsCacheClient);
  },
};
