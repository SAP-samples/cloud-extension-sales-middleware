const { cache } = require('../constants/constants');

module.exports = (appContainer) => {
  if (cache.isCachingEnabled) {
    appContainer.factory({
      visitsAPIClient: require('../repositories/apis/visits-api-client').factory,
      visitsCacheClient: require('../repositories/cache/visits-cache-client').factory,
      contactsAPIClient: require('../repositories/apis/contacts-api-client').factory,
      contactsCacheClient: require('../repositories/cache/contacts-cache-client').factory,
      accountsAPIClient: require('../repositories/apis/accounts-api-client').factory,
      accountsCacheClient: require('../repositories/cache/accounts-cache-client').factory,
      issuesCacheClient: require('../repositories/cache/issues/issues-cache-client').factory,
      issueTasksCacheClient: require('../repositories/cache/issues/issue-tasks-cache-client').factory,
      issueItemsCacheClient: require('../repositories/cache/issues/issue-items-cache-client').factory,
      userAPIClient: require('../repositories/apis/user-api-client').factory,
      tasksAPIClient: require('../repositories/apis/tasks-api-client').factory,
      issuesAPIClient: require('../repositories/apis/issues/issues-api-client').factory,
      issueTasksAPIClient: require('../repositories/apis/issues/issue-tasks-api-client').factory,
      productsAPIClient: require('../repositories/apis/products-api-client').factory,
      tasksCacheClient: require('../repositories/cache/tasks-cache-client').factory,
      visitsRepository: require('../repositories/visits-repository').factory,
      contactsRepository: require('../repositories/contacts-repository').factory,
      accountsRepository: require('../repositories/accounts-repository').factory,
      userRepository: require('../repositories/user-repository').factory,
      tasksRepository: require('../repositories/tasks-repository').factory,
      issuesRepository: require('../repositories/issues-repository').factory,
      issueTasksRepository: require('../repositories/issue-tasks-repository').factory,
      productsRepository: require('../repositories/products-repository').factory,
    });
  } else {
    appContainer.factory({
      visitsRepository: require('../repositories/visits-repository').factory,
      contactsRepository: require('../repositories/contacts-repository').factory,
      accountsRepository: require('../repositories/accounts-repository').factory,
      userRepository: require('../repositories/user-repository').factory,
      tasksRepository: require('../repositories/tasks-repository').factory,
      issuesRepository: require('../repositories/issues-repository').factory,
      issueTasksRepository: require('../repositories/issue-tasks-repository').factory,
      productsRepository: require('../repositories/products-repository').factory,
    });
  }
  appContainer.factory({
    visitService: require('../services/visit-service').factory,
    contactsService: require('../services/contacts-service').factory,
    accountsService: require('../services/accounts-service').factory,
    userService: require('../services/user-service').factory,
    tasksService: require('../services/tasks/tasks-service').factory,
    issuesService: require('../services/issues/issues-service').factory,
    issueTasksService: require('../services/issues/issue-tasks-service').factory,
    productsService: require('../services/products-service').factory,
    cacheService: require('../services/cache/cache-service').factory,
    visitsCacheService: require('../services/cache/visits-cache-service').factory,
    contactsCacheService: require('../services/cache/contacts-cache-service').factory,
    accountsCacheService: require('../services/cache/accounts-cache-service').factory,
    tasksCacheService: require('../services/cache/tasks-cache-service').factory,
    issuesCacheService: require('../services/cache/issues-cache-service').factory,
    caiVisitService: require('../services/cai/cai-visit-service').factory,
  });
};
