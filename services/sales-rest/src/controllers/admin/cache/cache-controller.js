const { OK, BAD_REQUEST } = require('http-status-codes');

const clearCache = (cacheService) => (req, res) => cacheService.clearCache().then(() => res.sendStatus(OK));

const userPopulationControllerFactory = (userService) => (req, res) => userService.populateUserCache().then(userDetails => res.json(userDetails))
  .catch(error => res.status(BAD_REQUEST).json(error));

module.exports = [{
  method: 'DELETE',
  path: '/cache',
  name: 'clearCache',
  handlerFactory: clearCache,
}, {
  method: 'POST',
  path: '/cache/users',
  name: 'userCachePopulationJob',
  handlerFactory: userPopulationControllerFactory,
}];
