const { BaseCacheService } = require("./base-cache-service")
const logger = require('../../logger/console')("TasksCacheService");

class TasksCacheService extends BaseCacheService {

  constructor(tasksManager, tasksCache) {
    super("Task", {
      Root: () => this._root
    })

    this.tasksManager = tasksManager;
    this.tasksCache = tasksCache;
  }

  _root = (entityId, eventType) => {
    logger.info(`Sales Cloud Task ${eventType} event received`);
    if (eventType === 'Created') {
      return this.tasksManager.addTaskInCache(entityId);
    }
    if (eventType === 'Updated') {
      return this.tasksManager.updateTaskInCache(entityId);
    }
    if (eventType === 'Deleted') {
      return this.tasksCache.deleteFromCache(entityId);
    }
    return new Promise(((resolve) => {
      logger.error(`invalid event type for tasks received: ${entityType}`);
      resolve(false);
    }));
  }

}
module.exports = {
  factory(tasksManager, tasksCache) {
    return new TasksCacheService(tasksManager, tasksCache);
  },
};
