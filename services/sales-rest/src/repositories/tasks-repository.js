const logger = require('../logger/console')("TasksRepository");
const { userErrors } = require('../constants/errors');

class TasksRepository {
  constructor(tasksAPIClient, tasksCacheClient, issueTasksCacheClient) {
    this.tasksAPIClient = tasksAPIClient;
    this.tasksCacheClient = tasksCacheClient;
    this.issueTasksCacheClient = issueTasksCacheClient;
  }

  findTasks({ userId, filterQuery, pagination }) {
    return this
      .tasksCacheClient
      .findTasksForUser({ userId, tasksQuery: filterQuery.string, pagination })
      .then(cachedTasksResponse => {
        if (cachedTasksResponse.cacheHit) {
          return {
            results: cachedTasksResponse.result,
            paginationData: cachedTasksResponse.paginationData,
          };
        }
        return this
          .tasksAPIClient
          .fetchTasks({ userId, filterParams: filterQuery.params, pagination })
          .then(tasksResponse => this.tasksCacheClient.populateTasks({
            userId, tasksQuery: filterQuery.string, pagination, tasksResponse,
          }));
      });
  }

  findTaskByObjectId({ userId, taskObjectID }) {
    return this
      .tasksCacheClient
      .findTaskByObjectId(taskObjectID)
      .then((cachedTask) => {
        if (cachedTask.cacheHit) {
          return cachedTask.result;
        }
        return this.tasksAPIClient.fetchTaskByObjectId(taskObjectID)
          .then(task => this.tasksCacheClient.addNewTaskInCache(task))
          .catch(error => {
            logger.error(`Error: ${error.message}`);
            return Promise.reject(error);
          });
      })
      .then(task => {
        if (task.OwnerUUID !== userId) {
          return Promise.reject(userErrors.TASK_NOT_FOUND(taskObjectID));
        }
        return task;
      });
  }

  deleteTask({ userId, taskObjectID }) {
    return this
      .tasksAPIClient
      .deleteTask({ userId, taskObjectID })
      .then(() => this.unassignTaskFromIssue({ userId, taskObjectID }));
  }

  unassignTaskFromIssue({ userId, taskObjectID }) {
    return this.tasksAPIClient.unassignTaskFromIssue({ userId, taskObjectID });
  }

  findIssueTaskCollectionFor(taskObjectID) {
    return this.tasksAPIClient.findIssueTaskCollectionFor(taskObjectID);
  }

  createStandaloneTask({ userId, newTask }) {
    return this.tasksAPIClient.createTask({ userId, newTask })
      .then(createdTask => this.tasksCacheClient.addNewTaskInCache(createdTask));
  }

  createTaskFromIssue({ userId, newTask }) {
    return this.tasksAPIClient
      .createTask({ userId, newTask })
      .then(createdTask => this.tasksCacheClient.addNewTaskInCache(createdTask))
      .then(createdTask => this
        .tasksAPIClient
        .assignTaskToIssue({ taskId: createdTask.UUID, issueObjectID: newTask.issueId })
        .then(issueTask => this.issueTasksCacheClient.addNewIssueTaskInCache(issueTask))
        .then(() => createdTask));
  }

  updateTaskInCache(taskObjectID) {
    return Promise
      .all([this.tasksCacheClient.findTaskByObjectId(taskObjectID), this.tasksAPIClient.fetchTaskByObjectId(taskObjectID)])
      .then(([cachedTask, salesCloudTask]) => {
        if (cachedTask.cacheHit) {
          logger.info(`Updated Task found in cache: ${taskObjectID}`);
          return this.tasksCacheClient.updateCachedTask({ cachedTask: cachedTask.result, updatedTask: salesCloudTask });
        }
        logger.info(`Updated Task not found in cache: ${taskObjectID}`);
        return this.tasksCacheClient.addNewTaskInCache(salesCloudTask);
      });
  }

  addTaskInCache(taskObjectID) {
    return this
      .tasksAPIClient
      .fetchTaskByObjectId(taskObjectID)
      .then(salesCloudTask => this.tasksCacheClient.addNewTaskInCache(salesCloudTask));
  }
}

module.exports = {
  factory(tasksAPIClient, tasksCacheClient, issueTasksCacheClient) {
    return new TasksRepository(tasksAPIClient, tasksCacheClient, issueTasksCacheClient);
  },
};
