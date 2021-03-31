class IssueItemsRepository {
  constructor(issueItemsAPIClient) {
    this.issueItemsAPIClient = issueItemsAPIClient;
  }

  fetchIssueItemsList() {
    return this.issueItemsAPIClient.fetchIssueItemsList();
  }

  findIssueItemsByProductObjectID(productObjectID) {
    return this.issueItemsAPIClient.findIssueItemsByProductObjectID(productObjectID);
  }
}
module.exports = {
  factory: (issueTasksAPIClient) => new IssueItemsRepository(issueTasksAPIClient),
};
