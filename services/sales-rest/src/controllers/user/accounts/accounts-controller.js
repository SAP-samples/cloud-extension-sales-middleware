const logger = require('../../../logger/console')("Accounts Controller")
const { validateUUIDStringRequestParam } = require('../../../validators/request-validator');
const { getPaginationParamsFrom, getQueryParamsFrom } = require('../../../helpers/requests');

const accountsControllerFactory = (accountsService) => (req, res) =>
  accountsService
    .findAccounts({ filters: getQueryParamsFrom(req, ['name']), pagination: getPaginationParamsFrom(req) })
    .then(results => res.json(results));

const accountControllerFactory = (accountsService) => (req, res) => {
  const { accountId } = req.params;
  return validateUUIDStringRequestParam(accountId)
    .then(() => accountsService.findAccountDetails(accountId))
    .then(account => res.json(account))
    .catch(error => {
      logger.error(`Could not get account by Id: ${error.message}`);
      res.json(error.message);
    });
};

const accountContactsControllerFactory = (accountsService) => (req, res) => {
  const { accountId } = req.params;
  return validateUUIDStringRequestParam(accountId)
    .then(() => accountsService.findAccountContacts(accountId))
    .then(account => res.json(account))
    .catch(error => {
      logger.error(`Could not get contacts for account: ${error.message}`);
      res.json(error.message);
    });
};

const accountsRatingsControllerFactory = (accountsService) => (req, res) =>
  accountsService
    .getRatingsList()
    .then(results => res.json({ results }));

module.exports = [{
  method: 'GET',
  path: '/accounts/',
  name: 'accountsControllerFactory',
  handlerFactory: accountsControllerFactory,
},
{
  method: 'GET',
  path: '/accounts/ratings',
  name: 'accountsRatingsController',
  handlerFactory: accountsRatingsControllerFactory,
},
{
  method: 'GET',
  path: '/accounts/:accountId',
  name: 'accountController',
  handlerFactory: accountControllerFactory,
},
{
  method: 'GET',
  path: '/accounts/:accountId/contacts',
  name: 'accountContactsController',
  handlerFactory: accountContactsControllerFactory,
},
];
