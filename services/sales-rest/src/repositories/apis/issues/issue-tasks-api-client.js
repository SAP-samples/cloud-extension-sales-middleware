const { toUUID } = require('to-uuid');
const { logger, salesCloud: { credentials } } = require('../../../constants/constants');
const { createAPIClient, getResultsFromODataResponse } = require('../../../helpers/odata');

const issueTasksApiClient = createAPIClient();

class IssueTasksAPIClient {
  fetchIssueTasksList() {
    const expandEntities = 'IssueRoot/IssueItem';
    logger.info('Fetching IssueTask List from Sales Cloud');
    return issueTasksApiClient
      .get(`${credentials.issueBaseURL}/IssueTaskCollection?$expand=${expandEntities}`)
      .then(response => getResultsFromODataResponse(response.data));
  }

  getIssueTasksForTask(taskObjectID) {
    logger.info(`Fetching issue-task collection for task ${taskObjectID} from Sales Cloud`);
    const taskUUID = toUUID(taskObjectID);
    const filterQuery = `SAP_ToActivity eq guid'${taskUUID}'`;
    const expandEntities = 'IssueRoot/IssueItem';
    return issueTasksApiClient
      .get(`${credentials.issueBaseURL}/IssueTaskCollection?$filter=${filterQuery}&$expand=${expandEntities}`)
      .then(issueTasksCollectionResponse => getResultsFromODataResponse(issueTasksCollectionResponse.data));
  }
}

module.exports = {
  factory: () => new IssueTasksAPIClient(),
};
