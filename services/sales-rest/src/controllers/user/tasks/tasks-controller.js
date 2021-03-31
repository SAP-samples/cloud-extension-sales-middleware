const { isEmpty } = require('lodash');
const {
  CREATED, BAD_REQUEST, NO_CONTENT, INTERNAL_SERVER_ERROR,
} = require('http-status-codes');
const {
  buildStatusArrayFrom, getPaginationParamsFrom, getUserIdFrom, getQueryParamsFrom, getQueryStringFrom,
} = require('../../../helpers/requests');
const logger = require('../../../logger/console')("Tasks Controller");
const { requestErrors } = require('../../../constants/errors');

const getFilterParamsFrom = (req) => {
  const { account, status } = getQueryParamsFrom(req, ['account', 'status']);
  const filterParams = { };
  if (account) {
    filterParams.account = account;
  }
  if (status) {
    filterParams.statusFilters = buildStatusArrayFrom(status);
  }
  return filterParams;
};

const tasksControllerFactory = (tasksService) => (req, res) => tasksService
  .findTasksBy({
    userId: getUserIdFrom(req),
    filterQuery: {
      string: getQueryStringFrom(req),
      params: getFilterParamsFrom(req),
    },
    pagination: getPaginationParamsFrom(req),
  })
  .then(tasks => res.json(tasks));

const taskDetailsControllerFactory = (tasksService) => (req, res) => {
  const { taskObjectID } = req.params;
  return tasksService
    .findTaskDetails({ userId: getUserIdFrom(req), taskObjectID })
    .then(task => res.json(task))
    .catch(error => {
      logger.error(`Could not retrieve task by id in TaskController: ${error.message}`);
      res.json(error.message);
    });
};

const taskCreationControllerFactory = (tasksService) => (req, res) => {
  if (isEmpty(req.body)) {
    res.status(BAD_REQUEST).send('Empty body');
  } else {
    tasksService
      .createTask({ userId: getUserIdFrom(req), newTask: req.body })
      .then(createdTask => res.status(CREATED).json(createdTask))
      .catch(error => {
        logger.error(`Error when creating new task: ${error.message}`);
        res.status(BAD_REQUEST).send(requestErrors.ERROR_NEW_TASK_CREATION());
      });
  }
};

const taskDeletionControllerFactory = (tasksService) => (req, res) => {
  const { taskObjectID } = req.params;
  const userId = getUserIdFrom(req);
  return tasksService
    .deleteTask({ userId, taskObjectID })
    .then(() => res.sendStatus(NO_CONTENT))
    .catch(error => {
      logger.error(`Error when trying to delete task: ${error.message}`);
      res.status(INTERNAL_SERVER_ERROR).send(requestErrors.TASK_COULD_NOT_BE_DELETED(taskObjectID));
    });
};

module.exports = [{
  method: 'GET',
  path: '/tasks',
  name: 'tasksController',
  handlerFactory: tasksControllerFactory,
},
{
  method: 'GET',
  path: '/tasks/:taskObjectID',
  name: 'taskDetailsController',
  handlerFactory: taskDetailsControllerFactory,
},
{
  method: 'POST',
  path: '/tasks',
  name: 'taskCreationController',
  handlerFactory: taskCreationControllerFactory,
},
{
  method: 'DELETE',
  path: '/tasks/:taskObjectID',
  name: 'taskDeletionController',
  handlerFactory: taskDeletionControllerFactory,
},
];
