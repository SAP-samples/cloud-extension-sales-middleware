const { BAD_REQUEST } = require('http-status-codes');
const requestHelper = require('../../../helpers/requests');
const logger = require('../../../logger/console')("UserProfileController");

const userProfileControllerFactory = (userService) => (req, res) => {
  const userId = requestHelper.getUserIdFrom(req);
  logger.info(`Fetching user profile data for userId: ${userId}`);
  return userService.findUserById(userId).then(userDetails => res.json(userDetails))
    .catch(error => res.status(BAD_REQUEST).json(error));
};

const userTokenEchoControllerFactory = () => (req, res) => {
  res.json({ authorizationToken: req.headers.authorization.substring(7) });
};

module.exports = [{
  method: 'GET',
  path: '/user/profile',
  name: 'userProfileController',
  handlerFactory: userProfileControllerFactory,
}, {
  method: 'GET',
  path: '/user/token',
  name: 'userTokenEchoController',
  handlerFactory: userTokenEchoControllerFactory,
}];
