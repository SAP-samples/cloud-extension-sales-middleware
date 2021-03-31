/* eslint-disable no-param-reassign */
const logger = require("../logger/console")("VisitsManager")

class VisitsManager {
  constructor(visitsAPIClient, visitsCache) {
    this.visitsAPIClient = visitsAPIClient;
    this.visitsCache = visitsCache;
  }

  updateVisitInCache(visitId) {
    return Promise.all([
      this.visitsCache.findVisitById(visitId),
      this.visitsAPIClient.fetchVisitByUUID(visitId)])
      .then(([cachedVisit, salesCloudVisit]) => {
        if (cachedVisit.cacheHit) {
          logger.info(`Updated Visit found in cache: ${visitId}`);
          logger.info(`Old Visit: ${JSON.stringify(cachedVisit.result)}`);
          logger.info(`New Visit: ${JSON.stringify(salesCloudVisit)}`);
          return this.visitsCache.updateCachedVisit(cachedVisit.result, salesCloudVisit);
        }
        logger.info(`Updated Visit not found in cache: ${visitId}`);
        logger.info(`New Visit: ${JSON.stringify(salesCloudVisit)}`);
        return this.visitsCache.addNewVisitInCache(salesCloudVisit);
      });
  }

  addVisitInCache(visitUUID) {
    return this
      .visitsAPIClient
      .fetchVisitByUUID(visitUUID)
      .then(visitODataResponse => this.visitsCache.addNewVisitInCache(visitODataResponse));
  }
}

module.exports = {
  factory(visitsAPIClient, visitsCache) {
    return new VisitsManager(visitsAPIClient, visitsCache);
  },
};
