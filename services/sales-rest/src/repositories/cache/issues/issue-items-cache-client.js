const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../../../helpers/redis');
const logger = require('../../../logger/console')("IssueItemsCacheClient");
const { cache: { keys: { expiration } }, values } = require('../../../constants/constants');
const { flattenPipelineResponse } = require('../../../helpers/redis');

class IssueItemsCacheClient {
  constructor(cache) {
    this.cache = cache;
  }

  getIssueItemsList() {
    const issueItemsSetKey = this._buildIssueItemsSetKey();
    logger.info('Fetching all cached IssueItem collection');
    return this
      ._getIssueItemIDsFromSet(issueItemsSetKey)
      .then(issueItemsIDs => {
        if (issueItemsIDs.cacheHit) {
          return this
            ._getIssueItemsByCacheIDs(issueItemsIDs.result)
            .then(issueItems => ({ result: issueItems, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
  }

  getIssueItemsCacheIDs(issueItemsIDs) {
    return issueItemsIDs
      .reduce((pipeline, issueItemID) => pipeline.hgetall(
        this._buildIssueItemKey(issueItemID)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  getIssueItemsForIssue(issueObjectID) {
    const issuesItemsSetKey = this._buildIssueAssignedItemsSetKey(issueObjectID);
    return this
      ._getIssueItemIDsFromSet(issuesItemsSetKey)
      .then(issueItemIDs => {
        if (issueItemIDs.cacheHit) {
          return this
            .getIssueItemsCacheIDs(issueItemIDs.result)
            .then(issueItems => ({ result: issueItems, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
  }

  populateIssueItemsForIssue(issueObjectID, assignedIssueItems) {
    this.cacheIssueItemsMappings(issueObjectID, assignedIssueItems);
    this.populateIssueItems(assignedIssueItems);
  }

  /**
   * for each  issue, store the IDs of the assigned items
   */
  cacheIssueItemsMappings(issueObjectID, issueItems) {
    const issueAssignedItemsSetKey = this._buildIssueAssignedItemsSetKey(issueObjectID);
    logger.info(`Cache Issue-Items Mappings for issue: ${issueObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .sadd(issueAssignedItemsSetKey, [values.NO_ISSUE_ITEMS, ...issueItems.map(issueIem => issueIem.ObjectID)])
        .expire(issueAssignedItemsSetKey, expiration.issueItem);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueItems;
  }

  populateIssueItems(issueItems) {
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const issueItemsSetKey = this._buildIssueItemsSetKey();
      pipeline
        .sadd(issueItemsSetKey, [values.NO_ISSUE_ITEMS, ...issueItems.map(issueItem => issueItem.ObjectID)])
        .expire(issueItemsSetKey, expiration.issueIem);
      issueItems
        .forEach(issueItem => {
          const issueItemKey = this._buildIssueItemKey(issueItem.ObjectID);
          pipeline
            .hset(issueItemKey, issueItem)
            .expire(issueItemKey, expiration.issueItem);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueItems;
  }

  populateIssueItem(issueItem) {
    const issueItemKey = this._buildIssueItemKey(issueItem.ObjectID);
    logger.info(`Caching IssueItem with ID: ${issueItem.ObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .hset(issueItemKey, issueItem)
        .expire(issueItemKey, expiration.issueItem);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueItem;
  }

  deleteFromCache(issueItemObjectID) {
    return this
      .find(issueItemObjectID)
      .then(cachedIssueItem => {
        if (cachedIssueItem.cacheHit) {
          logger.info(`Deleted cached IssueItem ID: ${issueItemObjectID}`);
          return this.cache.del(this._buildIssueItemKey(issueItemObjectID));
        }
        return Promise.resolve();
      });
  }

  _getIssueItemsByCacheIDs(issueItemsIDs) {
    return issueItemsIDs
      .reduce((pipeline, issueItemsID) => pipeline.hgetall(this._buildIssueItemKey(issueItemsID)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  _getIssueItemIDsFromSet(issueItemsSetKey) {
    return this
      .cache
      .smembers(issueItemsSetKey)
      .then(issueItemIds => {
        if (isEmpty(issueItemIds)) {
          return { cacheHit: false, result: [] };
        }
        return { cacheHit: true, result: issueItemIds.filter(issueItemId => issueItemId !== values.NO_ISSUE_ITEMS) };
      });
  }

  _buildIssueItemKey(issueItemObjectID) {
    return buildCacheKeyFrom({
      type: 'issueItems',
      id: issueItemObjectID,
    });
  }

  _buildIssueAssignedItemsSetKey(issueObjectID) {
    return buildCacheKeyFrom({
      type: `issues/${issueObjectID}/assignedItems`,
    });
  }

  _buildIssueItemsSetKey() {
    return buildCacheKeyFrom({
      type: 'issueItems',
    });
  }
}

module.exports = {
  factory: (cache) => new IssueItemsCacheClient(cache),
};
