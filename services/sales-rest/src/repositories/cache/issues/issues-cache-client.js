
const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../../../helpers/redis');
const logger = require('../../../logger/console')("IssuesCacheClient");
const {
  cache: { keys: { expiration } },
  values,
} = require('../../../constants/constants');
const { flattenPipelineResponse } = require('../../../helpers/redis');
const { objectValuesToInteger } = require('../../../helpers/converters');

class IssuesCacheClient {
  constructor(cache, issueTasksCacheClient, issueItemsCacheClient) {
    this.cache = cache;
    this.issueTasksCacheClient = issueTasksCacheClient;
    this.issueItemsCacheClient = issueItemsCacheClient;
  }

  findIssues({ userId, issuesQuery, pagination }) {
    const issuesSetKey = this._buildIssuesSetKey({ userId, issuesQuery });
    return this
      ._getIssueIdsBy({ issuesSetKey, pagination })
      .then(issueIds => {
        if (issueIds.cacheHit) {
          return this._getIssuesFromCache(issueIds.result)
            .then(issues => this._getPaginationData(issuesSetKey)
              .then(paginationData => ({ result: issues, cacheHit: true, paginationData })));
        }
        return { cacheHit: false, result: [] };
      });
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
      this.issueTasksCacheClient.getIssueTasksForIssue(issueObjectID),
      this.issueItemsCacheClient.getIssueItemsForIssue(issueObjectID),
    ])
      .then(([issue, tasks, products]) => {
        const issueDetails = issue;
        issueDetails.result.IssueTask = tasks.result;
        issueDetails.result.IssueItem = products.result;
        return issueDetails;
      });
  }

  populateIssues({
    userId, issuesQuery, pagination, issuesResponse,
  }) {
    const skip = pagination.page * pagination.size;
    const issuesSetKey = this._buildIssuesSetKey({ userId, issuesQuery });
    const scoreByIndex = issuesResponse.results.map((issue, index) => [skip + index + 1, issue.ObjectID]);
    this._setPaginationData(issuesSetKey, issuesResponse.paginationData);

    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      pipeline
        .zadd(issuesSetKey, [skip, values.NO_ISSUES], ...scoreByIndex)
        .expire(issuesSetKey, expiration.issue);
      issuesResponse.results
        .forEach(issue => {
          const issueKey = this._buildIssueKey(issue.ObjectID);
          pipeline
            .hset(issueKey, issue)
            .expire(issueKey, expiration.issue);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(err => {
          logger.error(err.message);
          reject(err);
        });
    });
    return issuesResponse;
  }

  populateIssue(issue) {
    logger.info(`Cache issue with id: ${issue.ObjectID}`);
    this.issueTasksCacheClient.populateIssueTasksForIssue(issue.ObjectID, issue.IssueTask);
    this.issueItemsCacheClient.populateIssueItemsForIssue(issue.ObjectID, issue.IssueItem);
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

  _getIssuesFromCache(issueIds) {
    logger.info('Get cached issues');
    return issueIds
      .reduce((pipeline, issueId) => pipeline.hgetall(this._buildIssueKey(issueId)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  _getIssueIdsBy({ issuesSetKey, pagination }) {
    const startRange = pagination.page * pagination.size + 1;
    const stopRange = startRange + pagination.size;

    return this
      .cache
      .zrangebyscore(issuesSetKey, startRange, stopRange)
      .then(issueIds => {
        if (isEmpty(issueIds)) {
          return this._checkIfPaginatedSetHasNoIssues(issuesSetKey)
            .then(noIssuesForSet => {
              if (noIssuesForSet) {
                return { cacheHit: true, result: [] };
              }
              return { cacheHit: false, result: [] };
            });
        }
        logger.info(`Get cached Issue Ids Range[${startRange}, ${stopRange}] from set: ${issuesSetKey}`);
        return { cacheHit: true, result: issueIds.filter(issueId => issueId !== values.NO_ISSUES) };
      });
  }

  _setPaginationData(issuesSetKey, paginationData) {
    const issuesSetPaginationKey = this._buildIssuesSetPaginationKey(issuesSetKey);
    return this
      .cache
      .pipeline()
      .hset(issuesSetPaginationKey, paginationData)
      .expire(issuesSetPaginationKey, expiration.issue)
      .exec();
  }

  _getPaginationData(issuesSetKey) {
    const issuesSetPaginationKey = this._buildIssuesSetPaginationKey(issuesSetKey);
    return this
      .cache
      .hgetall(issuesSetPaginationKey)
      .then(paginationData => objectValuesToInteger(paginationData));
  }

  _checkIfPaginatedSetHasNoIssues(issuesSetKey) {
    return this
      .cache
      .zscore(issuesSetKey, values.NO_ISSUES)
      .then(emptySetScore => !isEmpty(emptySetScore));
  }

  _buildIssuesSetKey({ userId, issuesQuery }) {
    return buildCacheKeyFrom({
      // userId, //TODO: store issue by employee responsible/processor...
      type: 'issues',
      id: issuesQuery,
    });
  }

  _buildIssuesSetPaginationKey(issuesSetKey) {
    return buildCacheKeyFrom({
      type: `${issuesSetKey}/paginationData`,
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
  factory: (cache, issueTasksCacheClient, issueItemsCacheClient) => new IssuesCacheClient(cache, issueTasksCacheClient, issueItemsCacheClient),
};
