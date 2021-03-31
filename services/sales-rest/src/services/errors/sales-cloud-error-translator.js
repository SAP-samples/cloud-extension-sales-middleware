const { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } = require('http-status-codes');
const { salesCloudErrors } = require('../../constants/errors');
const logger = require('../../logger/console')("SalesCloudErrorTranslator");

class SalesCloudErrorTranslator {
  handle({ errorData }) {
    if (errorData.status === NOT_FOUND) {
      logger.error(`SalesCloudError NOT_FOUND: ${errorData.message}`);
      return Promise.reject(salesCloudErrors.ENTITY_NOT_FOUND);
    }
    if (errorData.status === BAD_REQUEST) {
      logger.error(`SalesCloudError BAD_REQUEST: ${errorData.message}`);
      return Promise.reject(salesCloudErrors.BAD_REQUEST);
    }
    if (errorData.status === UNAUTHORIZED) {
      logger.error(`SalesCloudError Unauthorized: ${errorData.message}`);
      return Promise.reject(salesCloudErrors.UNAUTHORIZED);
    }
    logger.error(`SalesCloudError: ${errorData.message}`);
    return Promise.reject(salesCloudErrors.GENERIC_EXCEPTION);
  }
}

module.exports = {
  factory: () => new SalesCloudErrorTranslator(),
};
