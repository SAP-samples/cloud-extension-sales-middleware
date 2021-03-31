require('dotenv').config();
const { EOL } = require('os');

if (!process.env.CONFIGURATION) {
  console.error("Environment variable 'CONFIGURATION' wasn't specified.");
  process.exit();
}
const cfg = JSON.parse(process.env.CONFIGURATION);

ENABLE_AUTH=true
SALES_CLOUD_BASE_URL = ""
SALES_CLOUD_USER = ""
SALES_CLOUD_USER_PASSWORD = ""

const csrfConfig = cfg.csrfConfig
if (csrfConfig && csrfConfig.tokenUrl) {
  SALES_CLOUD_BASE_URL = csrfConfig.tokenUrl.replace("/v1/c4codataapi/", "");

  const credentials = cfg.credentials
  if (credentials && credentials.username && credentials.password) {
    SALES_CLOUD_USER = credentials.username
    SALES_CLOUD_USER_PASSWORD = credentials.password
  } else {
    ENABLE_AUTH = false
  }
} else {
  ENABLE_AUTH = false
}


module.exports = Object.freeze({
  server: {
    port: process.env.PORT || 8080,
    eventsBaseURL: "/"
  },
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
  values: {
    EMPTY_STRING: '',
    NEW_LINE: EOL,
    DEFAULT_LOCALE: 'US',
    SPACE: ' ',
    REQ_QUERY_SEPARATOR: '|',
    DEFAULT_USER_ID: '00163E8B-259B-1EDA-9E98-432D21F5D55E',
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
  salesCloud: {
    isAuthEnabled: ENABLE_AUTH,
    credentials: {
      username: SALES_CLOUD_USER,
      password: SALES_CLOUD_USER_PASSWORD,
      baseURL: SALES_CLOUD_BASE_URL,
      visitsBaseURL: `${SALES_CLOUD_BASE_URL}/v1/c4codataapi`,
      contactsBaseURL: `${SALES_CLOUD_BASE_URL}/v1/c4codataapi`,
      tasksBaseURL: `${SALES_CLOUD_BASE_URL}/v1/c4codataapi`,
      accountsBaseURL: `${SALES_CLOUD_BASE_URL}/v1/c4codataapi`,
      issuesBaseURL: `${SALES_CLOUD_BASE_URL}/cust/v1/issue`,
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
  }
});
