const { isUndefined } = require('lodash');
const moment = require('moment');
const { userErrors } = require('../constants/errors');
const { validateUUIDStringRequestParam } = require('./request-validator');

const validateVisitsQueryParamsFrom = request => {
  const { targetDay } = request.query;
  if (isUndefined(targetDay) || moment.parseZone(targetDay).isValid()) {
    return Promise.resolve(true);
  }
  return Promise.reject(userErrors.INVALID_VISIT_DATE_FILTER);
};
const validateVisitIdReqParam = visitId => validateUUIDStringRequestParam(visitId);

module.exports = {
  validateVisitsQueryParamsFrom,
  validateVisitIdReqParam,
};
