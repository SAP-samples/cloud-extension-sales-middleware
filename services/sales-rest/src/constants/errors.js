const { FORBIDDEN, UNAUTHORIZED } = require('http-status-codes');

module.exports = {
  userErrors: {
    VISIT_NOT_FOUND: (visitId) => ({
      code: 'USR001',
      message: `Visit ${visitId} was not found`,
    }),
    TASK_NOT_FOUND: (taskId) => ({
      code: 'USR002',
      message: `Task ${taskId} was not found`,
    }),
    INVALID_VISIT_DATE_FILTER: () => ({
      code: 'VAL001',
      message: 'Invalid date to filter visits',
    }),
  },
  eventErrors: {
    EVENT_HANDLER_NOT_IMPLEMENTED: (eventType) => ({
      code: 'VAL002',
      message: `Subscribed to an event in SalesCloud, but could not find event handler for the event type [${eventType}]`,
    }),
  },
  requestErrors: {
    MISSING_USER_ID: () => ({
      code: 'REQ001',
      message: 'Missing userId header param from request',
    }),
    INVALID_UUID_REQUEST_PARAMETER: (reqParam) => ({
      code: 'REQ002',
      message: `Invalid UUID String request param: ${reqParam} `,
    }),
    EMPTY_PAYLOAD: () => ({
      code: 'REQ003',
      message: 'Empty payload: not valid',
    }),
    TASK_COULD_NOT_BE_DELETED: (taskId) => ({
      code: 'REQ004',
      message: `Task ${taskId} could not be deleted`,
    }),
    ERROR_NEW_TASK_CREATION: () => ({
      code: 'REQ005',
      message: 'Error when trying to create new task',
    }),
  },
  securityErrors: {
    MISSING_AUTHENTICATION: { status: UNAUTHORIZED, message: 'Request is not authorized.' },
    FORBIDDEN: { status: FORBIDDEN, message: 'You do not have access to this resource.' },
  },
};
