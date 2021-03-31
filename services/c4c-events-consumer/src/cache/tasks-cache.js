const { isEmpty } = require('lodash');
const { cache: { keys: { expiration } } } = require('../constants/constants');
const { buildCacheKeyFrom } = require('../helpers/redis');
const logger = require('../logger/console')("TasksCache");
const { sanitize } = require("../helpers/utils")

class TasksCache {
  constructor(cache) {
    this.cache = cache;
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

  addNewTaskInCache(task) {
    task = sanitize(task)
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
    updatedTask = sanitize(updatedTask)

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
}

module.exports = {
  factory: (cache) => new TasksCache(cache),
};
