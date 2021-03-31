
const logger = require('../../logger/console')("VisitsCacheService");

class VisitsCacheService {
  constructor(visitsRepository, visitsCacheClient) {
    this.visitsRepository = visitsRepository;
    this.visitsCacheClient = visitsCacheClient;
  }

  updateCacheByEventType({ entityId, eventType }) {
    logger.info(`Sales Cloud VISIT ${eventType} event received`);
    if (eventType === 'Created') {
      return this.visitsRepository.addVisitInCache(entityId);
    } if (eventType === 'Updated') {
      return this.visitsRepository.updateVisitInCache(entityId);
    } if (eventType === 'Deleted') {
      return this.visitsCacheClient.deleteFromCache(entityId);
    }
    logger.error(`invalid event type for visits received: ${eventType}`);
    return false;
  }
}
module.exports = {
  factory(visitsRepository, visitsCacheClient) {
    return new VisitsCacheService(visitsRepository, visitsCacheClient);
  },
};
