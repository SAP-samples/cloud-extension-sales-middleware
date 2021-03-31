const { BaseCacheService } = require("./base-cache-service")
const logger = require('../../logger/console')("IssuesCacheService");

class IssuesCacheService extends BaseCacheService {
  constructor(issuesManager, issuesCache) {
    super("Issue", {
      Root: () => this._root
    })

    this.issuesManager = issuesManager;
    this.issuesCache = issuesCache;
  }

  _root = (entityId, eventType) => {
    if (eventType === 'Created') {
      return this.issuesManager.addNewIssueInCache(entityId);
    } if (eventType === 'Updated') {
      return this.issuesManager.updateIssueInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.issuesCache.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for issues received: ${eventType}`);
      resolve(false);
    }));
  }
}
module.exports = {
  factory(issuesManager, issuesCache) {
    return new IssuesCacheService(issuesManager, issuesCache);
  },
};
