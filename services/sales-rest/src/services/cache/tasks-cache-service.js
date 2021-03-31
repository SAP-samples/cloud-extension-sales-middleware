
const logger = require('../../logger/console')("TasksCacheService");

class TasksCacheService {
  constructor(tasksRepository, tasksCacheClient) {
    this.tasksRepository = tasksRepository;
    this.tasksCacheClient = tasksCacheClient;
  }

  updateCacheByEventType({ entityId, eventType }) {
    logger.info(`Sales Cloud Task ${eventType} event received`);
    if (eventType === 'Created') {
      return this.tasksRepository.addTaskInCache(entityId);
    }
    if (eventType === 'Updated') {
      return this.tasksRepository.updateTaskInCache(entityId);
    }
    if (eventType === 'Deleted') {
      return this.tasksCacheClient.deleteFromCache(entityId);
    }
    logger.error(`invalid event type for tasks received: ${eventType}`);
    return false;
  }
}
module.exports = {
  factory(tasksRepository, tasksCacheClient) {
    return new TasksCacheService(tasksRepository, tasksCacheClient);
  },
};
