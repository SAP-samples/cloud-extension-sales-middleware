const { salesCloud: { credentials } } = require('../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse
} = require('../helpers/odata');
const logger = require("../logger/console")("AccountsAPIClient")

const accountsApiClient = createAPIClient();

class AccountsAPIClient {

  findAccountByObjectID(accountObjectID) {
    logger.info(`Fetching account ${accountObjectID} from Sales Cloud `);
    return accountsApiClient
      .get(`${credentials.accountsBaseURL}/CorporateAccountCollection('${accountObjectID}')`)
        .then(accountResponse => getResultsFromODataResponse(accountResponse.data));
      //.then(accountResponse => accountResponse.data);
  }

}
module.exports = {
  factory: () => new AccountsAPIClient(),
};
