
const { get } = require('lodash');
const { NOT_FOUND } = require('http-status-codes');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  findUserByEmail(userEmail) {
    return this
      .userRepository
      .findUserByEmail(userEmail);
  }

  findUserById(userId) {
    return this
      .userRepository
      .findUserById(userId)
      .catch(err => {
        if (get(err, 'response.status') === NOT_FOUND) {
          return null;// TODO: let global exception handler to catch odata exceptions
        }
        return Promise.reject(err);
      });
  }

  populateUserCache() {
    return this.userRepository.populateUserCache();
  }
}
module.exports = {
  factory(userRepository) {
    return new UserService(userRepository);
  },
};
