const { salesCloud: { credentials }, logger } = require('../../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse, getCountFromODataResponse,
  getTopParameterValue, getSkipParameterValue,
} = require('../../helpers/odata');
const { createPaginationDataFrom } = require('../../helpers/pagination');

const accountsApiClient = createAPIClient();

class AccountsAPIClient {
  fetchAccounts({ pagination }) {
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);

    logger.info('Fetching accounts from Sales Cloud ');
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCollection?$skip=${skip}&$top=${top}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }

  findAccountByObjectID(accountObjectID) {
    logger.info(`Fetching account ${accountObjectID} from Sales Cloud `);
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCollection('${accountObjectID}')`)
      .then(accountResponse => getResultsFromODataResponse(accountResponse.data));
  }

  findAccountDetails(accountObjectID) {
    logger.info(`Fetching account details: ${accountObjectID} from Sales Cloud `);
    const expandEntitites = 'CorporateAccountHasContactPerson/Contact';
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCollection('${accountObjectID}')?$expand=${expandEntitites}`)
      .then(accountResponse => getResultsFromODataResponse(accountResponse.data));
  }

  fetchAccountContacts(accountObjectID) {
    logger.info(`Fetching contacts for accoutn: ${accountObjectID} from Sales Cloud `);
    const expandEntitites = 'Contact';
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCollection('${accountObjectID}')/CorporateAccountHasContactPerson?$expand=${expandEntitites}`)
      .then(accountResponse => getResultsFromODataResponse(accountResponse.data));
  }

  searchAccountsBy({ name, pagination }) {
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);

    logger.info(`Searching accounts by name: ${name} in Sales Cloud`);
    const filterByNameQuery = `substringof('${name}', Name)`;
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCollection?$filter=${filterByNameQuery}&$skip=${skip}&$top=${top}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }

  fetchAccountsRatingList() {
    return accountsApiClient
      .get(`${credentials.standardBaseURL}/CorporateAccountCustomerABCClassificationCodeCollection`)
      .then(ratings => getResultsFromODataResponse(ratings.data));
  }
}
module.exports = {
  factory: () => new AccountsAPIClient(),
};
