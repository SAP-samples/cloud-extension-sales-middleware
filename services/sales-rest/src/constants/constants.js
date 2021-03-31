require('dotenv').config();

const { EOL } = require('os');

// if (process.env.NODE_ENV === 'development') {
//   logger.setLoggingLevel('silly');
//   logger.setLogPattern('{{written_at}} - {{msg}} - {{method}} - {{request}} ');
// }

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
    port: process.env.PORT || 3000,
    baseURL: process.env.BASE_URL || '/api/v1/sales',
    caiBaseURL: process.env.CAI_BASE_URL || '/api/v1/cai/sales',
    adminBaseURL: process.env.ADMIN_BASE_URL || '/api/v1/admin',
  },
  authentication: {
    adminAPIKey: process.env.admin_api_key || '',
    isXSUAAEnabled: process.env.xsuaa_clientid !== undefined && process.env.xsuaa_clientid !== '',
    fakeUserId: process.env.FAKE_USER_ID || '00163E03-A070-1EE2-88BA-39BD20DA50B5',
    credentials: {
      url: process.env.xsuaa_url,
      clientid: process.env.xsuaa_clientid,
      clientsecret: process.env.xsuaa_clientsecret,
      xsappname: process.env.xsuaa_xsappname,
      identityzone: process.env.xsuaa_identityzoneid,
      verificationkey: process.env.xsuaa_verificationkey
    },
    strategy: 'JWT',
  },
  salesCloud: {
    credentials: {
      username: SALES_CLOUD_USER,
      password: SALES_CLOUD_USER_PASSWORD,
      baseURL: SALES_CLOUD_BASE_URL,
      standardBaseURL: `${SALES_CLOUD_BASE_URL}/v1/c4codataapi`,
      issueBaseURL: `${SALES_CLOUD_BASE_URL}/cust/v1/issue`,
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
    oData: {
      // TODO: extract all entities mappings to a separate file
      MAX_PAGE_SIZE: 1000,
      fields: {
        issue: {
          TASK_ID_MAPPING: 'SAP_ToActivity',
          ISSUE_TASK_COLLECTION: 'IssueTaskCollection',
        },
        task: {
          TASKS_COLLECTION: 'TasksCollection',
          TASK_OWNER: 'OwnerUUID',
          TASK_ACCOUNT_OBJECT_ID: 'AccountUUID',
          TASK_ACCOUNT_NAME: 'Account',
          DESCRIPTION_LIST: 'TasksTextCollection',
          TASK_DUE_DATE: 'DueDateTime',
        },
      },
    },
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
      entities: {
        users: 'users',
      },
    },
  },
  values: {
    EMPTY_STRING: '',
    NEW_LINE: EOL,
    DEFAULT_LOCALE: 'US',
    SPACE: ' ',
    REQ_QUERY_SEPARATOR: '|',
    DEFAULT_USER_ID: '00163E8B-259B-1EDA-9E98-432D21F5D55E',
    // TODO: Move under the 'cache' key
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
  pagination: {
    defaults: {
      startPage: 0,
      size: 50,
    },
  },
  database: {
    credentials: {
      uri: process.env.mongo_connectionString,
    },
  },
});
