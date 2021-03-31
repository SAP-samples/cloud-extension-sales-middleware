const { logger, salesCloud: { credentials } } = require('../../../constants/constants');
const { createAPIClient, getResultsFromODataResponse } = require('../../../helpers/odata');

const issueItemsApiClient = createAPIClient();

class IssueItemsAPIClient {
  fetchIssueItemsList() {
    const expandEntities = 'IssueRoot';
    logger.info('Fetching IssueItems from Sales Cloud');
    return issueItemsApiClient
      .get(`${credentials.issueBaseURL}/IssueItemCollection?$expand=${expandEntities}`)
      .then(response => getResultsFromODataResponse(response.data));
  }

  findIssueItemsByProductObjectID(productUUID) {
    logger.info(`Fetching issue-item collection for product ${productUUID} from Sales Cloud`);
    const filterQuery = `SAP_ToProduct eq guid'${productUUID}'`;
    const expandEntities = 'IssueRoot';
    return issueItemsApiClient
      .get(`${credentials.issueBaseURL}/IssueItemCollection?$filter=${filterQuery}&$expand=${expandEntities}`)
      .then(issueItemsCollectionResponse => getResultsFromODataResponse(issueItemsCollectionResponse.data));
  }
}

module.exports = {
  factory: () => new IssueItemsAPIClient(),
};
