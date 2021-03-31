const logger = require("../logger/console")("TasksManager")

class TasksManager {
  constructor(tasksAPIClient, tasksCache, issueTasksCache) {
    this.tasksAPIClient = tasksAPIClient;
    this.tasksCache = tasksCache;
    this.issueTasksCache = issueTasksCache;
  }

  updateTaskInCache(taskObjectID) {
    return Promise
      .all([this.tasksCache.findTaskByObjectId(taskObjectID), this.tasksAPIClient.fetchTaskByObjectId(taskObjectID)])
      .then(([cachedTask, salesCloudTask]) => {
        if (cachedTask.cacheHit) {
          logger.info(`Updated Task found in cache: ${taskObjectID}`);
          return this.tasksCache.updateCachedTask({ cachedTask: cachedTask.result, updatedTask: salesCloudTask });
        }
        logger.info(`Updated Task not found in cache: ${taskObjectID}`);
        return this.tasksCache.addNewTaskInCache(salesCloudTask);
      });
  }

  addTaskInCache(taskObjectID) {
    return this
      .tasksAPIClient
      .fetchTaskByObjectId(taskObjectID)
      .then(salesCloudTask => this.tasksCache.addNewTaskInCache(salesCloudTask));
  }
}

module.exports = {
  factory(tasksAPIClient, tasksCache, issueTasksCache) {
    return new TasksManager(tasksAPIClient, tasksCache, issueTasksCache);
  },
};
