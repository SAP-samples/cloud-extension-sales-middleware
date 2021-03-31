const { cache } = require('../constants/constants');

const initModules = appContainer => {
  if (cache.isCachingEnabled) {
    // cache
    appContainer.factory({
      visitsCache: require('../cache/visits-cache').factory,
      contactsCache: require('../cache/contacts-cache').factory,
      accountsCache: require('../cache/accounts-cache').factory,
      tasksCache: require('../cache/tasks-cache').factory,

      issuesCache: require('../cache/issues/issues-cache').factory,
      issueTasksCache: require('../cache/issues/issue-tasks-cache').factory,
      issueItemsCache: require('../cache/issues/issue-items-cache').factory,
    });
  }

  // clients
  appContainer.factory({
    visitsAPIClient: require('../clients/visits-api-client').factory,
    contactsAPIClient: require('../clients/contacts-api-client').factory,
    accountsAPIClient: require('../clients/accounts-api-client').factory,
    tasksAPIClient: require('../clients/tasks-api-client').factory,
    issuesAPIClient: require('../clients/issues/issues-api-client').factory,
  });


  // managers
  appContainer.factory({
    visitsManager: require('../managers/visits-manager').factory,
    contactsManager: require('../managers/contacts-manager').factory,
    accountsManager: require('../managers/accounts-manager').factory,
    tasksManager: require('../managers/tasks-manager').factory,
    issuesManager: require('../managers/issues-manager').factory,
  });

  // services
  appContainer.factory({
    accountsCacheService: require('../services/cache/accounts-cache-service').factory,
    contactsCacheService: require('../services/cache/contacts-cache-service').factory,
    issuesCacheService: require('../services/cache/issues-cache-service').factory,
    tasksCacheService: require('../services/cache/tasks-cache-service').factory,
    visitsCacheService: require('../services/cache/visits-cache-service').factory,

    cloudEventsService: require('../services/cloud-events-service').factory,
  });
};

module.exports = {
  initModules,
};
