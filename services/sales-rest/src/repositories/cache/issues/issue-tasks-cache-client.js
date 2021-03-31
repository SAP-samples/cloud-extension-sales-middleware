const { isEmpty } = require('lodash');
const { buildCacheKeyFrom } = require('../../../helpers/redis');
const logger = require('../../../logger/console')("IssueTasksCacheClient");
const { cache: { keys: { expiration } }, values } = require('../../../constants/constants');
const { flattenPipelineResponse } = require('../../../helpers/redis');
const { uuidToString } = require('../../../helpers/converters');

class IssueTasksCacheClient {
  constructor(cache) {
    this.cache = cache;
  }

  getIssueTasksList() {
    const issueTaskSetKey = this._buildIssueTaskSetKey();
    logger.info('Fetching all cached IssueTask collection');
    return this._getIssueTasksIDsFrom(issueTaskSetKey)
      .then(issueTasksIDs => {
        if (issueTasksIDs.cacheHit) {
          return this
            ._getIssueTasksByCacheIDs(issueTasksIDs.result)
            .then(issueTaskList => ({ result: issueTaskList, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
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

  getIssueTasksForTask(taskObjectID) {
    const taskRelatedIssueSetKey = this._buildTaskRelatedIssueSetKey(taskObjectID);
    return this._getIssueTasksIDsFrom(taskRelatedIssueSetKey)
      .then(issueTaskIDs => {
        if (issueTaskIDs.cacheHit) {
          return this
            ._getIssueTasksByIDs(issueTaskIDs.result)
            .then(issueTasks => ({ result: issueTasks, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
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

  cacheTaskIssueMapping(taskObjectID, issueTasks) {
    const taskRelatedIssueSetKey = this._buildTaskRelatedIssueSetKey(taskObjectID);
    logger.info(`Cache Mapping Task-RelatedIssue for task: ${taskObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .sadd(taskRelatedIssueSetKey, [values.NO_ISSUE_TASKS, ...issueTasks.map(issueTask => issueTask.ObjectID)])
        .expire(taskRelatedIssueSetKey, expiration.issueTask);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueTasks;
  }

  populateIssueTasksForIssue(issueObjectID, assignedIssueTasks) {
    logger.info(`Caching IssueTasks for issue: ${issueObjectID}`);
    this.cacheIssueTasksMappings(issueObjectID, assignedIssueTasks);
    this.populateIssueTasks(assignedIssueTasks);
    return assignedIssueTasks;
  }

  populateIssueTasksAssignedForTask(taskObjectID, assignedIssuesToTask) {
    logger.info(`Caching IssueTasks for task: ${taskObjectID}`);
    this.cacheTaskIssueMapping(taskObjectID, assignedIssuesToTask);
    this.populateIssueTasks(assignedIssuesToTask);
    return assignedIssuesToTask;
  }

  addNewIssueTaskInCache(issueTask) {
    const issueAssignedTasksSetKey = this._buildIssueAssignedTasksSetKey(issueTask.ParentObjectID);
    logger.info(`Cache Issue-AssignedTasks for issue: ${issueTask.ParentObjectID}`);
    const taskRelatedIssueSetKey = this._buildTaskRelatedIssueSetKey(uuidToString(issueTask.SAP_ToActivity));
    logger.info(`Cache Mapping Task-RelatedIssue for task: ${uuidToString(issueTask.SAP_ToActivity)}`);

    return new Promise((resolve, reject) => {
      const issueTasksSetKey = this._buildIssueTaskSetKey();
      const issueTaskKey = this._buildIssueTaskKey(issueTask.ObjectID);
      logger.info(`add new IssueTask in cache with id:${issueTask.ObjectID}`);
      const pipeline = this
        .cache
        .pipeline()
        .sadd(issueTasksSetKey, issueTask.ObjectID)
        .expire(issueTasksSetKey, expiration.issueTask)
        .sadd(issueAssignedTasksSetKey, issueTask.ObjectID)
        .expire(issueTasksSetKey, expiration.issueTask)
        .sadd(taskRelatedIssueSetKey, issueTask.ObjectID)
        .expire(taskRelatedIssueSetKey, expiration.issueTask);
      pipeline
        .hset(issueTaskKey, issueTask)
        .expire(issueTaskKey, expiration.issueTask);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
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
            .hset(issueTaskKey, issueTask)
            .expire(issueTaskKey, expiration.issueTask);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueTasks;
  }

  populateIssueTask(issueTask) {
    const issueTaskKey = this._buildIssueTaskKey(issueTask.ObjectID);
    logger.info(`Caching IssueTask with ID: ${issueTask.ObjectID}`);
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this
        .cache
        .pipeline()
        .hset(issueTaskKey, issueTask)
        .expire(issueTaskKey, expiration.issueTask);
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return issueTask;
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

  _getIssueTasksByCacheIDs(issueTaskIDs) {
    return issueTaskIDs
      .reduce((pipeline, issueTaskID) => pipeline.hgetall(this._buildIssueTaskKey(issueTaskID)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
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

  _buildTaskRelatedIssueSetKey(taskObjectID) {
    return buildCacheKeyFrom({
      type: `tasks/${taskObjectID}/relatedIssue`,
    });
  }
}

module.exports = {
  factory: (cache) => new IssueTasksCacheClient(cache),
};
