const { isEmpty } = require('lodash');
const {
  cache: { keys: { expiration } },
} = require('../../constants/constants');
const { buildCacheKeyFrom } = require('../../helpers/redis');
const { sanitize } = require("../../helpers/utils")

const logger = require('../../logger/console')("IssuesCache");

class IssuesCache {
  constructor(cache, issueTasksCache, issueItemsCache) {
    this.cache = cache;
    this.issueTasksCache = issueTasksCache;
    this.issueItemsCache = issueItemsCache;
  }

  findIssueByObjectID(issueObjectID) {
    return this
      .cache
      .hgetall(this._buildIssueKey(issueObjectID))
      .then(issue => {
        if (isEmpty(issue)) {
          return { result: {}, cacheHit: false };
        }
        return { result: issue, cacheHit: true };
      });
  }

  findIssueDetails(issueObjectID) {
    logger.info(`Get cached issue details : ${issueObjectID}`);
    return Promise.all([
      this.findIssueByObjectID(issueObjectID),
      this.issueTasksCache.getIssueTasksForIssue(issueObjectID),
      this.issueItemsCache.getIssueItemsForIssue(issueObjectID),
    ])
      .then(([issue, tasks, products]) => {
        const issueDetails = issue;
        issueDetails.result.IssueTask = tasks.result;
        issueDetails.result.IssueItem = products.result;
        return issueDetails;
      });
  }

  populateIssue(issue) {
    issue = sanitize(issue);

    logger.info(`Cache issue with id: ${issue.ObjectID}`);
    this.issueTasksCache.populateIssueTasksForIssue(issue.ObjectID, issue.IssueTask);
    this.issueItemsCache.populateIssueItemsForIssue(issue.ObjectID, issue.IssueItem);
    const issueCacheKey = this._buildIssueKey(issue.ObjectID);

    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .hset(issueCacheKey, issue)
        .expire(issueCacheKey, expiration.issue);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issue;
  }

  deleteFromCache(issueObjectID) {
    logger.info(`Deleting IssueTask with ID: ${issueObjectID}`);
    this.issueTasksCache.deleteFromCache(issueObjectID);
    this.issueItemsCache.deleteFromCache(issueObjectID);
    return this
        .getIssueTaskByObjectID(issueObjectID)
        .then(cachedIssueTask => {
          if (cachedIssueTask.cacheHit) {
            logger.info(`Deleting cached IssueTask ID: ${issueObjectID}`);
            return this.cache.del(this._buildIssueTaskKey(issueObjectID));
          }
          return Promise.resolve();
        });
  }

  _buildIssueKey(issueObjectID) {
    return buildCacheKeyFrom({
      type: 'issues',
      id: issueObjectID,
    });
  }
}
module.exports = {
  factory: (cache, issueTasksCache, issueItemsCache) => new IssuesCache(cache, issueTasksCache, issueItemsCache),
};
