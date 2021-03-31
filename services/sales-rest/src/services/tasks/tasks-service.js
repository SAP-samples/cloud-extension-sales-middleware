const { isEmpty, isUndefined, get } = require('lodash');
const { createDateFrom } = require('../../helpers/odata');
const { createPaginationResponse } = require('../../helpers/converters');
const logger = require('../../logger/console')("TasksService");

class TasksService {
  constructor(tasksRepository, issuesService, issueTasksService, accountsService, contactsService, userService) {
    this.tasksRepository = tasksRepository;
    this.issuesService = issuesService;
    this.issueTasksService = issueTasksService;
    this.accountsService = accountsService;
    this.userService = userService;
    this.contactsService = contactsService;
  }

  findTasksBy({ userId, filterQuery, pagination }) {
    return this
      .tasksRepository
      .findTasks({ userId, filterQuery, pagination })
      .then(tasksResponse => this._buildTaskDTOs(userId, tasksResponse.results)
        .then(results => ({ results, ...createPaginationResponse(tasksResponse.paginationData) })));
  }

  findTaskDetails({ userId, taskObjectID }) {
    return this
      .tasksRepository
      .findTaskByObjectId({ userId, taskObjectID })
      .then(task => this._buildTaskDetailsDTO(userId, task));
  }

  createTaskFromIssue({ userId, newTask }) {
    const { issueId } = newTask;
    const taskWithIssueDetails = newTask;
    return this.issuesService.findIssueDetails({ userId, issueObjectID: issueId })
      .then(issue => {
        taskWithIssueDetails.account = get(issue, 'account.id');
        taskWithIssueDetails.contact = get(issue, 'account.contact.id');
        return this.tasksRepository
          .createTaskFromIssue({ userId, newTask: taskWithIssueDetails })
          .then(createdTask => this._buildTaskDetailsDTO(userId, createdTask));
      });
  }

  createTask({ userId, newTask }) {
    if (newTask.issueId) {
      return this.createTaskFromIssue({ userId, newTask });
    }
    return this.tasksRepository
      .createStandaloneTask({ userId, newTask })
      .then(createdTask => this._buildStandaloneTaskDetailsDTO(createdTask));
  }

  deleteTask({ userId, taskObjectID }) {
    return this
      .tasksRepository
      .deleteTask({ userId, taskObjectID });
  }

  // TODO: split tasks service to standalone service and issue-task service
  _getRelatedIssueForTask(userId, task) {
    return this
      .issueTasksService
      .findIssueTasksForTask(task.ObjectID)
      .then(issueTasks => {
        if (isEmpty(issueTasks)) {
          return null;
        }
        if (issueTasks.size > 1) {
          logger.error('Issue assigned to multiple tasks. Display only the first issue ');
        }
        return this
          .issuesService
          .findIssueByObjectID({ userId, issueObjectID: issueTasks[0].ParentObjectID });
      });
  }

  _getRelatedIssueDetailsForTask(userId, task) {
    return this
      .issueTasksService
      .findIssueTasksForTask(task.ObjectID)
      .then(issueTasks => {
        if (isEmpty(issueTasks)) {
          return null;
        }
        if (issueTasks.size > 1) {
          logger.error('Issue assigned to multiple tasks. Display only the first issue ');
        }
        return this
          .issuesService
          .findIssueDetails({ userId, issueObjectID: issueTasks[0].ParentObjectID });
      });
  }

  _getAccountDTOByUUID(accountUUID) {
    if (!accountUUID) {
      return Promise.resolve(null);
    }
    return this
      .accountsService
      .findAccountByObjectID(accountUUID)
      .catch(error => {
        logger.error(`Account ${accountUUID} could not be retrieved for task details: ${error.message}`);
        return Promise.resolve(null);
      });
  }

  _getAccountDetailsDTOByUUID(accountUUID) {
    if (!accountUUID) {
      return Promise.resolve(null);
    }
    return this
      .accountsService
      .findAccountDetails(accountUUID)
      .catch(error => {
        logger.error(`Account details ${accountUUID} could not be retrieved for task details: ${error.message}`);
        return Promise.resolve(null);
      });
  }

  _getResolutionOptionsFor(task) {
    const taskProcessorUUID = task.ProcessorUUID;
    if (isEmpty(taskProcessorUUID) || isUndefined(taskProcessorUUID)) {
      return Promise.resolve(null);
    }
    return this.userService.findUserById(taskProcessorUUID);
  }

  _getTaskPrimaryContact(task) {
    const primaryContactUUID = task.PrimaryContactUUID;
    if (isEmpty(primaryContactUUID) || isUndefined(primaryContactUUID)) {
      return null;
    }
    return this.contactsService.findContactByUUID(primaryContactUUID);
  }

  _buildTaskDTOs(userId, tasks) {
    return Promise.all(tasks.map(task =>
      this._getAccountForTask(userId, task)
        .then(account => ({ ...this._toTaskDTO(task), account }))));
  }

  _getAccountForTask(userId, task) {
    return this
      ._getRelatedIssueForTask(userId, task)
      .then(issue => {
        if (issue) { return issue.account; }
        return this._getAccountDTOByUUID(task.AccountUUID);
      });
  }

  _buildIssueProductsDTOFrom(issue) {
    const issueProducts = issue.IssueItem;
    return issueProducts.map(issueProduct => this._buildIssueProductDTO(issueProduct));
  }

  _buildIssueProductDTO(issueProduct) {
    return {
      id: issueProduct.ZProductID,
      title: issueProduct.ZProductDescription,
      name: `Product ${issueProduct.ZProductID}`,
      financialSize: {
        value: parseFloat(issueProduct.ZTotalAmount),
        currency: issueProduct.currencyCode,
      },
    };
  }

  _buildTaskDetailsDTO(userId, task) {
    return this._getRelatedIssueDetailsForTask(userId, task)
      .then(issueDetails => {
        if (isEmpty(issueDetails)) {
          return this._buildStandaloneTaskDetailsDTO(task);
        }
        return this._buildTaskDetailsWithIssueDTO({ task, issueDetails });
      });
  }

  _buildTaskDetailsWithIssueDTO({ task, issueDetails }) {
    return this._toTaskDetailsDTO({
      task,
      issueDetails,
      account: issueDetails.account,
      primaryContact: get(issueDetails.account, 'contact'),
      resolutionOptions: issueDetails.resolutionOptions,
    });
  }

  _buildStandaloneTaskDetailsDTO(standaloneTask) {
    return Promise.all([
      this._getAccountDetailsDTOByUUID(standaloneTask.AccountUUID),
      this._getTaskPrimaryContact(standaloneTask),
      this._getResolutionOptionsFor(standaloneTask),
    ])
      .then(([account, primaryContact, resolutionOptions]) =>
        this._toTaskDetailsDTO({
          task: standaloneTask, issueDetails: null, account, primaryContact, resolutionOptions,
        }));
  }

  _toTaskDTO(task) {
    return {
      id: task.ObjectID,
      title: task.Subject,
      priority: task.PriorityCodeText ? task.PriorityCodeText.toUpperCase() : null,
      status: task.StatusText,
      type: task.DocumentTypeText,
      description: task.Description,
      startDate: createDateFrom(task.StartDateTime),
      dueDate: createDateFrom(task.DueDateTime),
      updateDate: createDateFrom(task.EntityLastChangedOn),
    };
  }

  _toTaskDetailsDTO({
    task, issueDetails, account, primaryContact, resolutionOptions,
  }) {
    return {
      ...this._toTaskDTO(task),
      issue: this._buildIssueDTOFrom(issueDetails),
      account: account || null,
      primaryContact: primaryContact || null,
      resolutionOptions: resolutionOptions || null,
    };
  }

  _buildIssueDTOFrom(issueDetails) {
    if (isEmpty(issueDetails)) {
      return null;
    }
    return {
      id: issueDetails.id,
      title: issueDetails.title,
      orderNumber: issueDetails.orderNumber,
      products: issueDetails.products,
    };
  }
}

module.exports = {
  factory: (tasksRepository, issuesService, issueTasksService, accountsService, contactsService, userService) => new TasksService(tasksRepository, issuesService, issueTasksService, accountsService, contactsService, userService),
};
