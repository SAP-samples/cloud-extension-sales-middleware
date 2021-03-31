require('dotenv').config();
const { EOL } = require('os');

module.exports = Object.freeze({
  cache: {
    isCachingEnabled: process.env.ENABLE_CACHING === 'true',
    credentials: {
      host: process.env.redis_host,
      password: process.env.redis_password,
      port: process.env.redis_port,
    },
    keys: {
      expiration: {
        visit: 28800,
        contact: 28800,
        account: 28800,
        task: 28800,
        issue: 2800,
        issueTask: 2800,
        issueItem: 2800,
      },
      formats: {
        dateWithTimezone: 'YYYY-MM-DDZZ',
      },
      search: {
        all: '*',
      },
      separator: '/',
      namespace: 'sales/US/',
    },
  },
  constants: {
    visitNoteTypeCode: '10002',
    visitStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED',
    },
    taskStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED',
    },
    taskPriorities: {
      IMMEDIATE: '1', URGENT: '2', NORMAL: '3', LOW: '7',
    },
    issueStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED', 5: 'ESCALATED',
    },
    eventPayload: {
      eventType: 'event-type',
      entityId: 'root-entity-id',
      eventId: 'event-id',
      eventTime: 'event-time',
    },
    visitNoteFormatter: {
      paragraphTag: 'p',
    },
  },
  values: {
    EMPTY_STRING: '',
    NEW_LINE: EOL,
    DEFAULT_LOCALE: 'US',
    SPACE: ' ',
    REQ_QUERY_SEPARATOR: '|',
    DEFAULT_USER_ID: undefined,
    NO_VISITS: 'NO_VISITS',
    NO_TASKS: 'NO_TASKS',
    NO_ISSUES: 'NO_ISSUES',
    NO_CONTACTS: 'NO_CONTACTS',
    NO_ISSUE_TASKS: 'NO_ISSUE_TASKS',
    NO_ISSUE_ITEMS: 'NO_ISSUE_ITEMS',
    errorMessages: {
      dates: {
        invalidDateFormat: (dateInput) => `The provided date format is invalid: [${dateInput}].`,
      },
      user: {
        missingUserId: () => 'The userId is missing.',
        invalidUserId: (userId) => `The provided userId is invalid: [${userId}].`,
      },
    },
  },
  constants: {
    visitNoteTypeCode: '10002',
    visitStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED',
    },
    taskStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED',
    },
    taskPriorities: {
      IMMEDIATE: '1', URGENT: '2', NORMAL: '3', LOW: '7',
    },
    issueStatuses: {
      1: 'OPEN', 2: 'IN_PROCESS', 3: 'COMPLETED', 4: 'CANCELED', 5: 'ESCALATED',
    },
    eventPayload: {
      eventType: 'event-type',
      entityId: 'root-entity-id',
      eventId: 'event-id',
      eventTime: 'event-time',
    },
    visitNoteFormatter: {
      paragraphTag: 'p',
    },
  },
});
