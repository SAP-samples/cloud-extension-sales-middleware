const { get } = require('lodash');
const { operationalErrors, programmerErrors } = require('../../constants/errors');
const logger = require('../../logger/console')("GlobalErrorTranslator");
const { isCloudErrorResponse } = require('../../helpers/requests');

class GlobalErrorTranslator {
  constructor(cloudExceptionHandler) {
    this.cloudExceptionHandler = cloudExceptionHandler;
  }

  handle(error) {
    if (isCloudErrorResponse(error)) {
      return this.cloudExceptionHandler.handle({ errorData: this._buildCloudErrorDataFrom(error) });
    }
    if (error instanceof TypeError) {
      logger.error(`TypeError received in ExceptionHandler: ${error.stack}`);
      return Promise.reject(programmerErrors.TYPE_ERROR);
    }
    logger.error(`ExceptionHandler:received error: ${error}`);
    return Promise.reject(operationalErrors.GENERIC_EXCEPTION);
  }

  _buildCloudErrorDataFrom(cloudResponse) {
    return {
      status: get(cloudResponse, 'response.status'),
      language: get(cloudResponse, 'response.data.error.message.lang'),
      message: get(cloudResponse, 'response.data.error.message.value'),
      cloudErrorCode: get(cloudResponse, 'response.data.error.code'),
    };
  }
}

module.exports = {
  factory: (salesCloudExceptionHandler) => new GlobalErrorTranslator(salesCloudExceptionHandler),
};
