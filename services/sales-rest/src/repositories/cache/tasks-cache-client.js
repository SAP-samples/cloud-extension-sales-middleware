const { isEmpty } = require('lodash');
const { cache: { keys: { expiration } }, values } = require('../../constants/constants');
const { buildCacheKeyFrom } = require('../../helpers/redis');
const logger = require('../../logger/console')("TasksCacheClient");
const { flattenPipelineResponse } = require('../../helpers/redis');
const { objectValuesToInteger } = require('../../helpers/converters');

class TasksCacheClient {
  constructor(cache) {
    this.cache = cache;
  }

  findTasksForUser({ userId, tasksQuery, pagination }) {
    const tasksSetKey = this._buildTasksSetKey({ userId, tasksQuery });
    return this._getTaskIdsBy({ tasksSetKey, pagination })
      .then(taskIds => {
        if (taskIds.cacheHit) {
          logger.info(`Retrieving cached tasks for user: ${userId}`);
          return this
            ._getTasksFromCache(taskIds.result)
            .then(tasks => this._getPaginationData(tasksSetKey)
              .then(paginationData => ({ result: tasks, cacheHit: true, paginationData })));
        }
        return { cacheHit: false, result: [] };
      });
  }

  findTaskByObjectId(taskId) {
    return this.cache
      .hgetall(this._buildTaskKey(taskId))
      .then(task => {
        if (isEmpty(task)) {
          return { result: {}, cacheHit: false };
        }
        logger.info(`Retrieving task from cache with id: ${taskId}`);
        return { result: task, cacheHit: true };
      });
  }

  populateTasks({
    userId, tasksQuery, pagination, tasksResponse,
  }) {
    const skip = pagination.page * pagination.size;
    const userTaskSetKey = this._buildTasksSetKey({ userId, tasksQuery });
    this._setPaginationData(userTaskSetKey, tasksResponse.paginationData);

    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const scoreByIndex = tasksResponse.results.map((task, index) => [skip + index + 1, task.ObjectID]);
      pipeline
        .zadd(userTaskSetKey, [skip, values.NO_TASKS], ...scoreByIndex)
        .expire(userTaskSetKey, expiration.task);
      tasksResponse.results
        .forEach(task => {
          const taskKey = this._buildTaskKey(task.ObjectID);
          pipeline
            .hset(taskKey, task)
            .expire(taskKey, expiration.task);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(err => {
          logger.error(err.message);
          reject(err);
        });
    });
    return tasksResponse;
  }

  addNewTaskInCache(task) {
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const userTaskSetKey = this._buildTasksSetKey(task.OwnerUUID);
      const taskId = task.ObjectID;
      this
        .cache
        .exists(userTaskSetKey)
        .then(existsUserTaskSetKey => {
          // TODO: add logic when to add a new task in cache,and  on what is the corresponding set
          logger.info(`add new task in cache with id:${taskId}`);
          const taskCacheKey = this._buildTaskKey(taskId);
          const pipeline = this
            .cache
            .pipeline()
            .sadd(userTaskSetKey, taskId)
            .expire(taskCacheKey, expiration.task);
          pipeline
            .hset(taskCacheKey, task)
            .expire(taskCacheKey, expiration.task);
          pipeline
            .exec()
            .then(resolve)
            .catch(reject);
        });
    });
    return task;
  }

  updateCachedTask({ cachedTask, updatedTask }) {
    const pipeline = this.cache.pipeline();
    if (cachedTask.OwnerUUID !== updatedTask.OwnerUUID) {
      logger.info(`Owner changed for task ${updatedTask.ObjectID}`);
      const oldUserTaskSetKey = this._buildTasksSetKey(cachedTask.OwnerUUID);
      pipeline.srem(oldUserTaskSetKey, cachedTask.ObjectID);// delete task from previous user set
    }
    pipeline
      .hset(this._buildTaskKey(updatedTask.ObjectID), updatedTask)
      .sadd(this._buildTasksSetKey(updatedTask.OwnerUUID, updatedTask.OwnerUUID));
    return pipeline.exec();
  }

  deleteFromCache(taskId) {
    return this
      .findTaskByObjectId(taskId)
      .then(cachedTask => {
        if (cachedTask.cacheHit) {
          logger.info(`Deleted task from cache with ID: ${taskId}`);
          return this
            .cache
            .del(this._buildTaskKey(taskId));
        }
        return Promise.resolve();
      });
  }

  _getTasksFromCache(taskIds) {
    return taskIds
      .reduce((pipeline, taskId) => pipeline.hgetall(this._buildTaskKey(taskId)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  _getTaskIdsBy({ tasksSetKey, pagination }) {
    const startRange = pagination.page * pagination.size + 1;
    const stopRange = startRange + pagination.size;
    return this
      .cache
      .zrangebyscore(tasksSetKey, startRange, stopRange)
      .then(taskIds => {
        if (isEmpty(taskIds)) {
          return this._checkIfPaginatedSetHasNoTasks(tasksSetKey)
            .then(noTasksForSet => {
              if (noTasksForSet) {
                return { cacheHit: true, result: [] };
              }
              return { cacheHit: false, result: [] };
            });
        }
        logger.info(`Get cached task Ids Range[${startRange}, ${stopRange}] from set: ${tasksSetKey}`);
        return { cacheHit: true, result: taskIds.filter(taskId => taskId !== values.NO_TASKS) };
      });
  }

  _setPaginationData(issuesSetKey, paginationData) {
    const issuesSetPaginationKey = this._buildTasksSetPaginationKey(issuesSetKey);
    return this
      .cache
      .pipeline()
      .hset(issuesSetPaginationKey, paginationData)
      .expire(issuesSetPaginationKey, expiration.issue)
      .exec();
  }

  _getPaginationData(tasksSetKey) {
    const tasksSetPaginationKey = this._buildTasksSetPaginationKey(tasksSetKey);
    return this
      .cache
      .hgetall(tasksSetPaginationKey)
      .then(paginationData => objectValuesToInteger(paginationData));
  }

  _checkIfPaginatedSetHasNoTasks(tasksSetKey) {
    return this.cache
      .zscore(tasksSetKey, values.NO_TASKS)
      .then(emptySetScore => !isEmpty(emptySetScore));
  }

  _buildTasksSetKey({ userId, tasksQuery }) {
    return buildCacheKeyFrom({
      userId,
      type: 'userTasks',
      id: tasksQuery,
    });
  }

  _buildTaskKey(taskId) {
    return buildCacheKeyFrom({
      id: taskId,
      type: 'tasks',
    });
  }

  _buildTasksSetPaginationKey(tasksSetKey) {
    return buildCacheKeyFrom({
      type: `${tasksSetKey}/paginationData`,
    });
  }
}

module.exports = {
  factory: (cache) => new TasksCacheClient(cache),
};
