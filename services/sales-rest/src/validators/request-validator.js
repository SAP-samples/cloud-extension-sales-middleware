const { toUUID } = require('to-uuid');
const { requestErrors } = require('../constants/errors');

const validateUUIDStringRequestParam = uuidString => {
  try {
    toUUID(uuidString);
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(requestErrors.INVALID_UUID_REQUEST_PARAMETER(uuidString));
  }
};

module.exports = {
  validateUUIDStringRequestParam,
};
