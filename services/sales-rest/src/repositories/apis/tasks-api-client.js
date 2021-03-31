
const {
  isEmpty, findKey, get, isUndefined, isNull,
} = require('lodash');
const { EOL: newline } = require('os');
const { toUUID } = require('to-uuid');
const {
  createAPIClient, buildRequestCredentialsFrom, getResultsFromODataResponse, getCountFromODataResponse,
  getSkipParameterValue, getTopParameterValue,
} = require('../../helpers/odata');
const { createPaginationDataFrom } = require('../../helpers/pagination');
const { stringToUUID } = require('../../helpers/converters');
const {
  logger, values: { EMPTY_STRING },
  salesCloud: {
    credentials, constants: { taskStatuses, taskPriorities },
    oData: {
      fields: {
        task: {
          TASK_OWNER,
          TASK_ACCOUNT_OBJECT_ID,
          TASK_ACCOUNT_NAME,
          DESCRIPTION_LIST,
          TASKS_COLLECTION,
          TASK_DUE_DATE,
        },
        issue: {
          ISSUE_TASK_COLLECTION,
          TASK_ID_MAPPING,
        },
      },
    },
  },
} = require('../../constants/constants');

const tasksApiClient = createAPIClient();

class TasksAPIClient {
  fetchTasks({ userId, filterParams, pagination }) {
    const expandEntities = DESCRIPTION_LIST;
    const filterQuery = this._buildTaskFilterQueryFrom({ userId, filterParams });
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);
    const orderBy = this._buildOrderByParam(pagination.sort);
    logger.info(`Fetching tasks from Sales Cloud for user ${userId}`);

    return tasksApiClient
      .get(`${credentials.standardBaseURL}/${TASKS_COLLECTION}?$filter=${filterQuery}&$expand=${expandEntities}&$skip=${skip}&$top=${top}&$orderby=${orderBy}&$inlinecount=allpages`)
      .then(oDataResponse => ({
        results: this._getTasksFrom(oDataResponse),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(oDataResponse) }),
      }));
  }

  fetchTaskByObjectId(taskObjectID) {
    const expandEntities = DESCRIPTION_LIST;
    logger.info(`Fetching task from Sales Cloud with id: ${taskObjectID}`);
    return tasksApiClient
      .get(`${credentials.standardBaseURL}/${TASKS_COLLECTION}('${taskObjectID}')?$expand=${expandEntities}`)
      .then(taskResponse => getResultsFromODataResponse(taskResponse.data))
      .then(task => this._setDescription(task));
  }

  findIssueTaskCollectionFor(taskObjectID) {
    logger.info(`Fetching issue-task collection for task ${taskObjectID} from Sales Cloud`);
    const filterQuery = `${TASK_ID_MAPPING} eq guid'${taskObjectID}'`;
    const expandEntities = 'IssueRoot/IssueItem';
    return tasksApiClient
      .get(`${credentials.issueBaseURL}/${ISSUE_TASK_COLLECTION}?$filter=${filterQuery}&$expand=${expandEntities}`)
      .then(issueTasksCollectionResponse => getResultsFromODataResponse(issueTasksCollectionResponse.data));
  }

  createTask({ userId, newTask }) {
    return tasksApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection?$filter=EmployeeUUID eq guid'${userId}'`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(userResponse => buildRequestCredentialsFrom(userResponse))
      .then(headers =>
        this._createNewStandaloneTaskInSalesCloud({ userId, newTask, headers }))
      .catch(err => {
        const errorMessage = err.response.data.error.message.value;
        logger.error(`Could not create task:${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
      });
  }

  deleteTask({ userId, taskObjectID }) {
    return tasksApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection?$filter=EmployeeUUID eq guid'${userId}'`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(userResponse => buildRequestCredentialsFrom(userResponse))
      .then(headers => this._deleteTaskFromSalesCloud({ userId, taskObjectID, headers }));
  }

  unassignTaskFromIssue({ userId, taskObjectID }) {
    const filterQuery = `${TASK_ID_MAPPING} eq guid'${toUUID(taskObjectID)}'`;
    return tasksApiClient
      .get(`${credentials.issueBaseURL}/${ISSUE_TASK_COLLECTION}?$filter=${filterQuery}`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(taskIssuesResponse => {
        const issueTasksList = getResultsFromODataResponse(taskIssuesResponse.data);
        if (isEmpty(issueTasksList)) {
          logger.info(`Task ${taskObjectID} does not have issue assigned,can not unlink it from issue `);
          return false;
        }
        const headers = buildRequestCredentialsFrom(taskIssuesResponse);
        return this._deleteIssueTasksMappings({ userId, issueTasksList, headers });
      });
  }

  _deleteTaskFromSalesCloud({ userId, taskObjectID, headers }) {
    return tasksApiClient({
      method: 'delete',
      url: `${credentials.standardBaseURL}/${TASKS_COLLECTION}('${taskObjectID}')`,
      headers,
    })
      .then(response => {
        logger.info(`Deleted task:${taskObjectID} from SalesCloud`);
        return response.data;
      })
      .catch(error => {
        const errorMessage = error.response.data.error.message.value;
        logger.error(`Could not delete task ${taskObjectID} from SalesCloud: ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
      });
  }

  _deleteIssueTasksMappings({ userId, issueTasksList, headers }) {
    const issueTasksMapping = issueTasksList[0];
    const taskId = issueTasksMapping[TASK_ID_MAPPING];
    const issueId = issueTasksMapping.ParentObjectID;
    return tasksApiClient({
      method: 'delete',
      url: `${credentials.issueBaseURL}/${ISSUE_TASK_COLLECTION}('${issueTasksMapping.ObjectID}')`,
      headers,
    })
      .then(response => {
        logger.info(`Unlinked task:${taskId} from issue: ${issueId}, in SalesCloud`);
        return response.data;
      })
      .catch(error => {
        const errorMessage = error.response.data.error.message.value;
        logger.error(`Could not unlink task ${taskId} from issue: ${issueId}, in SalesCloud: ${errorMessage}`);
        return Promise.reject(new Error(errorMessage));
      });
  }

  _getTasksFrom(oDataResponse) {
    const tasks = getResultsFromODataResponse(oDataResponse.data);
    return tasks.map(task => this._setDescription(task));
  }

  _buildTaskFilterQueryFrom({ userId, filterParams }) {
    const { account, statusFilters } = filterParams;
    const userFilterQuery = `${TASK_OWNER} eq guid'${userId}'`;
    const filters = [userFilterQuery];
    if (account) {
      filters.push(this._buildAccountFilter(account));
    }
    if (statusFilters) {
      filters.push(this._buildStatusFilter(statusFilters));
    }
    return filters.join(' and ');
  }

  _setDescription(task) {
    return { ...task, Description: this._getDescriptionFor(task) };
  }

  _getDescriptionFor(task) {
    const taskTexts = task[DESCRIPTION_LIST];
    if (isEmpty(taskTexts)) {
      return EMPTY_STRING;
    }
    return taskTexts.map(text => text.Text).join(newline);
  }

  _buildStatusFilter(statusFilters) {
    const statusFiltersQuery = statusFilters.map(statusText => {
      const statusCode = findKey(taskStatuses, (status) => status === statusText.toUpperCase());
      return `Status eq '${statusCode}'`;
    });
    return `(${statusFiltersQuery.join(' or ')})`;
  }

  _buildAccountFilter(account) {
    if (isNull(account) || isEmpty(account) || account === 'null') {
      return 'AccountUUID eq null';
    }
    const accountUUID = stringToUUID(account);
    return `${TASK_ACCOUNT_OBJECT_ID} eq guid'${accountUUID}'`;
  }

  _buildOrderByParam(sort) {
    if (sort === 'account') {
      return `${TASK_ACCOUNT_NAME} asc`;
    }
    return `${TASK_DUE_DATE} asc`;
  }

  /**
   * Description is a navigation entity for Task. When creating a new task, the description has to be under entity TasksTextCollection
   * OData V2 is not compliant with creation response. Only the root level properties are returned on creation response
   * Another request to task by ObjectID has to be done in order to get the navigation properties
   */
  _createNewStandaloneTaskInSalesCloud({ userId, newTask, headers }) {
    logger.info(`Creating new standalone task in SalesCloud for user:${userId}`);
    return tasksApiClient({
      method: 'post',
      url: `${credentials.standardBaseURL}/${TASKS_COLLECTION}`,
      headers,
      data: {
        Subject: newTask.title,
        StartDateTime: newTask.startDate,
        PriorityCode: this._getPriorityCodeFromBoolean(newTask.highPriority),
        AccountUUID: stringToUUID(newTask.account),
        PrimaryContactUUID: stringToUUID(newTask.contact),
        TasksTextCollection: this._createTaskTextNavigationPropertyFrom(newTask),
        OwnerUUID: userId,
      },
    })
      .then(taskResponse => getResultsFromODataResponse(taskResponse.data))
      .then(createdTask => this.fetchTaskByObjectId(createdTask.ObjectID));
  }

  assignTaskToIssue({ taskId, issueObjectID }) {
    return tasksApiClient
      .get(`${credentials.standardBaseURL}/${TASKS_COLLECTION}?$top=1`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(response => buildRequestCredentialsFrom(response))
      .then(headers => this._assignTaskToIssueInSalesCloud({ taskId, issueObjectID, headers }))
      .catch(err => {
        logger.error(`Could not assign task ${taskId} to issue: ${err.message}`);
        const errorMessage = get(err, 'response.data.error.message.value');
        return Promise.reject(isUndefined(errorMessage) ? 'Could not assign task to issue' : errorMessage);
      });
  }

  _assignTaskToIssueInSalesCloud({ taskId, issueObjectID, headers }) {
    logger.info(`Link task: ${taskId} to issue: ${issueObjectID}`);
    return tasksApiClient({
      method: 'post',
      url: `${credentials.issueBaseURL}/IssueTaskCollection`,
      headers,
      data: {
        ActivityUUID: taskId,
        ParentObjectID: issueObjectID,
      },
    })
      .then(issueTask => getResultsFromODataResponse(issueTask.data));
  }

  _createTaskTextNavigationPropertyFrom(newTaskDTO) {
    const newTaskDescription = newTaskDTO.description;
    if (!newTaskDescription) {
      return [];
    }
    return [{
      TypeCode: '10002',
      Text: newTaskDescription,
    }];
  }


  _getPriorityCodeFromBoolean(isHighPriority) {
    if (isHighPriority) {
      return taskPriorities.Immediate;
    }
    return taskPriorities.Normal;
  }
}

module.exports = {
  factory: () => new TasksAPIClient(),
};
