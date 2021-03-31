const { BaseCacheService } = require("./base-cache-service")
const logger = require('../../logger/console')("VisitsCacheService");

class VisitsCacheService extends BaseCacheService {

  constructor(visitsManager, visitsCache) {
    super("Visit", {
      Root: () => this._root
    })
    this.visitsManager = visitsManager;
    this.visitsCache = visitsCache;
  }

  _root = (entityId, entityType) => {
    if (entityType === 'Created') {
      return this.visitsManager.addVisitInCache(entityId);
    } if (entityType === 'Updated') {
      return this.visitsManager.updateVisitInCache(entityId);
    } if (entityType === 'Deleted') {
      return this.visitsCache.deleteFromCache(entityId);
    }

    return new Promise(((resolve) => {
      logger.error(`invalid event type for visits received: ${entityType}`);
      resolve(false);
    }));
  }
}
module.exports = {
  factory(visitsManager, visitsCache) {
    return new VisitsCacheService(visitsManager, visitsCache);
  },
};
