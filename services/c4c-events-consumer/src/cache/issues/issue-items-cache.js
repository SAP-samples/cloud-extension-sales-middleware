const { isEmpty } = require('lodash');
const { cache: { keys: { expiration } }, values } = require('../../constants/constants');
const { flattenPipelineResponse, buildCacheKeyFrom } = require('../../helpers/redis');
const { sanitize } = require("../../helpers/utils")

const logger = require('../../logger/console')("IssueItemsCache");

class IssueItemsCache {
  constructor(cache) {
    this.cache = cache;
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
            .hset(issueItemKey, sanitize(issueItem))
            .expire(issueItemKey, expiration.issueItem);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueItems;
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
  factory: (cache) => new IssueItemsCache(cache),
};
