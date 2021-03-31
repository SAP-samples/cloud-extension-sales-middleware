
class IssueTasksRepository {
  constructor(issueTasksAPIClient, issueTasksCacheClient) {
    this.issueTasksAPIClient = issueTasksAPIClient;
    this.issueTasksCacheClient = issueTasksCacheClient;
  }

  fetchIssueTasksList() {
    return this.issueTasksCacheClient
      .getIssueTasksList()
      .then(cachedIssueTasksResponse => {
        if (cachedIssueTasksResponse.cacheHit) {
          return cachedIssueTasksResponse.result;
        }
        return this
          .issueTasksAPIClient.fetchIssueTasksList()
          .then(issueTasks => this.issueTasksCacheClient.populateIssueTasks(issueTasks));
      });
  }

  findIssueTasksForTask(taskObjectID) {
    return this
      .issueTasksCacheClient
      .getIssueTasksForTask(taskObjectID)
      .then(cachedIssueTasks => {
        if (cachedIssueTasks.cacheHit) {
          return cachedIssueTasks.result;
        }
        return this
          .issueTasksAPIClient
          .getIssueTasksForTask(taskObjectID)
          .then(issueTasks => this.issueTasksCacheClient.populateIssueTasksAssignedForTask(taskObjectID, issueTasks));
      });
  }
}
module.exports = {
  factory: (issueTasksAPIClient, issueTasksCacheClient) => new IssueTasksRepository(issueTasksAPIClient, issueTasksCacheClient),
};
