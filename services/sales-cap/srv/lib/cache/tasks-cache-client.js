const { isEmpty } = require('lodash');
const { cache: { keys: { expiration } }, values } = require('../constants/constants');
const { buildCacheKeyFrom } = require('../helpers/redis');
const logger = require('../logger/console')("TasksCacheClient");
const { flattenPipelineResponse } = require('../helpers/redis');
const cache  = require('./cache')
const BaseCacheClient = require('./base-cache-client')

class TasksCacheClient extends BaseCacheClient {
  constructor(cache) {
    super(cache)
    this.cache = cache;
  }

  findTasksForUser({ userId, pagination }) {
    const tasksSetKey = this._buildTasksSetKey(userId);
    return this._getTaskIdsBy({ tasksSetKey, pagination })
      .then(taskIds => {
        if (taskIds.cacheHit) {
          logger.info(`Retrieving cached tasks for user: ${userId}`);
          return this
            ._getTasksFromCache(taskIds.result)
            .then(tasks => {
                    return { result: tasks, cacheHit: true };
                }
            );
        }
        return { cacheHit: false, result: [] };
      });
  }

  findTaskByObjectId(taskId) {
      if (!this.cache) {
          return new Promise((resolve, reject) => {
              return resolve({ cacheHit: false });
          })
      }
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
    userId, pagination, tasks,
  }) {
    const skip = pagination.skip;
    const userTaskSetKey = this._buildTasksSetKey(userId);

    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const scoreByIndex = tasks.map((task, index) => [skip + index + 1, task.ObjectID]);
      pipeline
        .zadd(userTaskSetKey, [skip, values.NO_TASKS], ...scoreByIndex)
        .expire(userTaskSetKey, expiration.task);
        tasks
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
    return tasks;
  }

  populateTaskInCache(task) {
      if (!this.cache) {
          return task
      }
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
      if (!this.cache) {
          return new Promise((resolve, reject) => {
              return resolve({ cacheHit: false });
          })
      }
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
      if (!this.cache) {
          return new Promise((resolve, reject) => {
              return resolve({ cacheHit: false });
          })
      }
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
      if (!this.cache) {
          return new Promise((resolve, reject) => {
              return resolve({ cacheHit: false });
          })
      }

    const startRange = pagination.skip + 1;
    const stopRange = startRange + pagination.top;
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

  _checkIfPaginatedSetHasNoTasks(tasksSetKey) {
      if (!this.cache) {
          return new Promise((resolve, reject) => {
              return resolve({ cacheHit: false });
          })
      }
    return this.cache
      .zscore(tasksSetKey, values.NO_TASKS)
      .then(emptySetScore => !isEmpty(emptySetScore));
  }

  _buildTasksSetKey(userId) {
    return buildCacheKeyFrom({
      userId,
      type: 'userTasks',
    });
  }

  _buildTaskKey(taskId) {
    return buildCacheKeyFrom({
      id: taskId,
      type: 'tasks',
    });
  }
}

module.exports = new TasksCacheClient(cache.cacheRedis);
