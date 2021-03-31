
const logger = require('../../logger/console')("IssuesCacheService");

class IssuesCacheService {
  constructor(issuesRepository, issuesCacheClient) {
    this.issuesRepository = issuesRepository;
    this.issuesCacheClient = issuesCacheClient;
  }

  updateCacheByEventType({ entityId, eventType }) {
    logger.info(`Sales Cloud ISSUE ${eventType} event received`);
    if (eventType === 'Created') {
      return this.issuesRepository.addNewIssueInCache(entityId);
    } if (eventType === 'Updated') {
      return this.issuesRepository.updateIssueInCache(entityId);
    } if (eventType === 'Deleted') {
      logger.info('DELETE issue event not yet implemented');
      return Promise.resolve();
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for issues received: ${eventType}`);
      resolve(false);
    }));
  }
}
module.exports = {
  factory(issuesRepository, issuesCacheClient) {
    return new IssuesCacheService(issuesRepository, issuesCacheClient);
  },
};
