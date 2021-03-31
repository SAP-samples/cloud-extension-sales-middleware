const { isEmpty } = require('lodash');
const { cache: { keys: { expiration } }, values } = require('../../constants/constants');
const { flattenPipelineResponse, buildCacheKeyFrom } = require('../../helpers/redis');
const { sanitize } = require("../../helpers/utils")

const logger = require('../../logger/console')("IssueTasksCache");

class IssueTasksCache {
  constructor(cache) {
    this.cache = cache;
  }

  getIssueTaskByObjectID(issueTaskObjectID) {
    return this
      .cache
      .hgetall(this._buildIssueTaskKey(issueTaskObjectID))
      .then(issueTask => {
        if (isEmpty(issueTask)) {
          return { result: {}, cacheHit: false };
        }
        return { result: issueTask, cacheHit: true };
      });
  }

  getIssueTasksForIssue(issueObjectID) {
    const issuesTasksSetKey = this._buildIssueAssignedTasksSetKey(issueObjectID);
    return this._getIssueTasksIDsFrom(issuesTasksSetKey)
      .then(issueTaskIDs => {
        if (issueTaskIDs.cacheHit) {
          return this
            ._getIssueTasksByIDs(issueTaskIDs.result)
            .then(issueTasks => ({ result: issueTasks, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
  }

  populateIssueTasksForIssue(issueObjectID, assignedIssueTasks) {
    logger.info(`Caching IssueTasks for issue: ${issueObjectID}`);
    this.cacheIssueTasksMappings(issueObjectID, assignedIssueTasks);
    this.populateIssueTasks(assignedIssueTasks);
    return assignedIssueTasks;
  }

  /**
   * for each  issue, store the IDs of the assigned tasks
   */
  cacheIssueTasksMappings(issueObjectID, issueTasks) {
    const issueAssignedTasksSetKey = this._buildIssueAssignedTasksSetKey(issueObjectID);
    logger.info(`Cache Issue-AssignedTasks for issue: ${issueObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .sadd(issueAssignedTasksSetKey, [values.NO_ISSUE_TASKS, ...issueTasks.map(issueTask => issueTask.ObjectID)])
        .expire(issueAssignedTasksSetKey, expiration.issueTask);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueTasks;
  }

  populateIssueTasks(issueTasks) {
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const issueTasksSetKey = this._buildIssueTaskSetKey();
      pipeline
        .sadd(issueTasksSetKey, [values.NO_ISSUE_TASKS, ...issueTasks.map(issueTask => issueTask.ObjectID)])
        .expire(issueTasksSetKey, expiration.issueTask);
      issueTasks
        .forEach(issueTask => {
          const issueTaskKey = this._buildIssueTaskKey(issueTask.ObjectID);
          pipeline
            .hset(issueTaskKey, sanitize(issueTask))
            .expire(issueTaskKey, expiration.issueTask);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueTasks;
  }

  deleteFromCache(issueTaskObjectID) {
    logger.info(`Deleting IssueTask with ID: ${issueTaskObjectID}`);
    return this
      .getIssueTaskByObjectID(issueTaskObjectID)
      .then(cachedIssueTask => {
        if (cachedIssueTask.cacheHit) {
          logger.info(`Deleting cached IssueTask ID: ${issueTaskObjectID}`);
          return this.cache.del(this._buildIssueTaskKey(issueTaskObjectID));
        }
        return Promise.resolve();
      });
  }

  _getIssueTasksByIDs(issueTaskIDs) {
    return issueTaskIDs
      .reduce((pipeline, issueTaskID) => pipeline.hgetall(this._buildIssueTaskKey(issueTaskID)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  _getIssueTasksIDsFrom(issueTaskSetKey) {
    return this
      .cache
      .smembers(issueTaskSetKey)
      .then(issueTaskIds => {
        if (isEmpty(issueTaskIds)) {
          return { cacheHit: false, result: [] };
        }
        return { cacheHit: true, result: issueTaskIds.filter(issueTaskId => issueTaskId !== values.NO_ISSUE_TASKS) };
      });
  }

  _buildIssueTaskKey(issueTaskObjectID) {
    return buildCacheKeyFrom({
      type: 'issueTasks',
      id: issueTaskObjectID,
    });
  }

  _buildIssueTaskSetKey() {
    return buildCacheKeyFrom({
      type: 'issueTasks',
    });
  }

  _buildIssueAssignedTasksSetKey(issueObjectID) {
    return buildCacheKeyFrom({
      type: `issues/${issueObjectID}/assignedTasks`,
    });
  }

}

module.exports = {
  factory: (cache) => new IssueTasksCache(cache),
};
