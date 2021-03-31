const logger = require("../logger/console")("IssuesManager")

class IssuesManager {
  constructor(issuesAPIClient, issuesCache) {
    this.issuesAPIClient = issuesAPIClient;
    this.issuesCache = issuesCache;
  }

  updateIssueInCache(issueObjectID) {
    return Promise.all([
      this.issuesCache.findIssueDetails(issueObjectID),
      this.issuesAPIClient.findIssueByObjectID({ issueObjectID })])
      .then(([cachedIssue, salesCloudIssue]) => {
        if (cachedIssue.cacheHit) {
          logger.info(`Updated Issue found in cache: ${issueObjectID}`);
        } else {
          logger.info(`Updated Issue not found in cache: ${issueObjectID}`);
        }
        // TODO: add logic when to not update issue in cache, if any
        return this.issuesCache.populateIssue(salesCloudIssue);
      });
  }

  addNewIssueInCache(issueObjectID) {
    return this
      .issuesAPIClient
      .findIssueByObjectID({ issueObjectID })
      .then(newIssue => this.issuesCache.populateIssue(newIssue));
  }
}

module.exports = {
  factory(issuesAPIClient, issuesCache) {
    return new IssuesManager(issuesAPIClient, issuesCache);
  },
};
