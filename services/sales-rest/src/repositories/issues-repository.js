const { isEmpty, map, findKey } = require('lodash');
const { logger, salesCloud: { constants: { issueStatuses } } } = require('../constants/constants');

class IssuesRepository {
  constructor(issuesAPIClient, issuesCacheClient) {
    this.issuesAPIClient = issuesAPIClient;
    this.issuesCacheClient = issuesCacheClient;
  }

  findIssuesBy({ userId, filterQuery, pagination }) {
    return this
      .issuesCacheClient
      .findIssues({ userId, issuesQuery: filterQuery.string, pagination })
      .then(cachedIssuesResponse => {
        if (cachedIssuesResponse.cacheHit) {
          return {
            results: cachedIssuesResponse.result,
            paginationData: cachedIssuesResponse.paginationData,
          };
        }
        return this
          .issuesAPIClient
          .fetchIssues({ userId, filterParams: filterQuery.params, pagination })
          .then(issuesResponse => this.issuesCacheClient.populateIssues({
            userId, issuesQuery: filterQuery.string, pagination, issuesResponse,
          }));
      });
  }

  findIssueByObjectID({ userId, issueObjectID }) {
    return this
      .issuesCacheClient
      .findIssueDetails(issueObjectID)
      .then((cachedIssue) => {
        if (cachedIssue.cacheHit) {
          return cachedIssue.result;
        }
        return this
          .issuesAPIClient
          .findIssueByObjectID({ userId, issueObjectID })
          .then(issue => this.issuesCacheClient.populateIssue(issue));
      });
  }

  countIssuesByStatusFilters({ userId, statusFilters }) {
    const countByStatus = this._getStatusDetailsList(statusFilters).map(status =>
      this.issuesAPIClient.countIssuesByStatus({ userId, status }));
    return Promise.all(countByStatus);
  }

  updateIssueInCache(issueObjectID) {
    return Promise.all([
      this.issuesCacheClient.findIssueDetails(issueObjectID),
      this.issuesAPIClient.findIssueByObjectID({ issueObjectID })])
      .then(([cachedIssue, salesCloudIssue]) => {
        if (cachedIssue.cacheHit) {
          logger.info(`Updated Issue found in cache: ${issueObjectID}`);
        } else {
          logger.info(`Updated Issue not found in cache: ${issueObjectID}`);
        }
        // TODO: add logic when to not update issue in cache, if any
        return this.issuesCacheClient.populateIssue(salesCloudIssue);
      });
  }

  addNewIssueInCache(issueObjectID) {
    return this
      .issuesAPIClient
      .findIssueByObjectID({ issueObjectID })
      .then(newIssue => this.issuesCacheClient.populateIssue(newIssue));
  }

  _getStatusDetailsList(statusFilters) {
    if (isEmpty) {
      return map(issueStatuses, (value, key) => ({
        code: key,
        text: value,
      }));
    }
    return statusFilters.map(statusFilter => this._getStatusDetailsFrom(statusFilter));
  }

  _createStatusDetailsFrom(statusFilter) {
    const statusCode = findKey(issueStatuses, (status) => status === statusFilter.toUpperCase());
    if (isEmpty(statusCode)) {
      logger.error(`Invalid status for issue: ${statusFilter}`);
      throw new Error(`Invalid status for issue: ${statusFilter}`);
    }
    return {
      code: statusCode,
      value: statusFilter,
    };
  }
}
module.exports = {
  factory(issuesAPIClient, issuesCacheClient) {
    return new IssuesRepository(issuesAPIClient, issuesCacheClient);
  },
};
