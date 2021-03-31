const { salesCloud: { credentials }, logger } = require('../../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse, getTopParameterValue, getSkipParameterValue, getCountFromODataResponse,
} = require('../../helpers/odata');
const { createPaginationDataFrom } = require('../../helpers/pagination');

const contactsApiClient = createAPIClient();

class ContactsAPIClient {
  fetchContacts({ pagination }) {
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);

    logger.info('Fetching contacts from Sales Cloud');
    return contactsApiClient
      .get(`${credentials.standardBaseURL}/ContactCollection?$skip=${skip}&$top=${top}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }

  findContactByObjectID(contactObjectID) {
    logger.info(`Fetching contact ${contactObjectID} from Sales Cloud`);
    return contactsApiClient
      .get(`${credentials.standardBaseURL}/ContactCollection('${contactObjectID}')`)
      .then(contactResponse => getResultsFromODataResponse(contactResponse.data));
  }

  findContactById(contactId) {
    logger.info(`Fetching contact by ID: ${contactId} from Sales Cloud`);
    return contactsApiClient
      .get(`${credentials.standardBaseURL}/ContactCollection?$filter=ContactID eq '${contactId}'`)
      .then(contactResponse => getResultsFromODataResponse(contactResponse.data));
  }

  searchContactsBy({ name, pagination }) {
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);

    logger.info(`Searching contacts by name: ${name} in Sales Cloud`);
    const filterByNameQuery = `substringof('${name}', Name)`;

    return contactsApiClient
      .get(`${credentials.standardBaseURL}/ContactCollection?$filter=${filterByNameQuery}&$skip=${skip}&$top=${top}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }
}
module.exports = {
  factory: () => new ContactsAPIClient(),
};
