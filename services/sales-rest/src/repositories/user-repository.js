const { range } = require('lodash');
const { salesCloud: { oData: { MAX_PAGE_SIZE } }, cache: { keys }, logger } = require('../constants/constants');

class UserRepository {
  constructor(userAPIClient, cache) {
    this.userAPIClient = userAPIClient;
    this.cache = cache;
  }

  findUserById(userId) {
    return this.userAPIClient.findUserById(userId);
  }

  findUserForAuthentication(userEmail) {
    return this.cache.hget(keys.entities.users, userEmail);
  }

  countUsers() {
    return this.userAPIClient.countUsers();
  }

  populateUserCache() {
    return this.countUsers()
      .then(userCount => {
        logger.info(`Importing ${userCount} users into the cache.`);
        const skipTokens = range(userCount / MAX_PAGE_SIZE).map(pageCount => pageCount * MAX_PAGE_SIZE + 1);
        return Promise.all(skipTokens.map(skipToken => this.userAPIClient.findAllUsers(skipToken)));
      }).then(userPages => userPages
        .reduce((multi, userPage) => multi.hmset(keys.entities.users, userPage), this.cache.multi().del(keys.entities.users))
        .exec())
      .then(() => ({ status: 'OK', message: 'Successfully imported users into the cache.' }));
  }
}
module.exports = {
  factory(userAPIClient, cache) {
    return new UserRepository(userAPIClient, cache);
  },
};
