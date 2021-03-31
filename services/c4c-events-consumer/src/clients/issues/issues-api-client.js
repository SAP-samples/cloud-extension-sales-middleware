const { salesCloud: { credentials } } = require('../../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse
} = require('../../helpers/odata');
const logger = require("../../logger/console")("IssuesAPIClient")

const issuesApiClient = createAPIClient();

class IssuesAPIClient {

  findIssueByObjectID({ issueObjectID }) {
    logger.info(`Fetching issue from Sales Cloud with id: ${issueObjectID}`);
    return issuesApiClient
      .get(`${credentials.issuesBaseURL}/IssueRootCollection('${issueObjectID}')?$expand=IssueItem,IssueTask`)
       .then(issueResponse => getResultsFromODataResponse(issueResponse.data));
      //.then(issueResponse => issueResponse.data);
  }
}

module.exports = {
  factory: () => new IssuesAPIClient(),
};
