const { values: { REQ_QUERY_SEPARATOR } } = require('../constants/constants');
const { salesCloud: { constants: { eventPayload } }, pagination } = require('../constants/constants');

const getUserIdFrom = (request) => request.authInfo.salesCloudUserId;

const getSalesEventDataFrom = (request) => {
  const [entityType, eventNode, eventType] = request.body[eventPayload.eventType].split('.');
  return {
    entityType,
    eventNode,
    eventType,
    entityId: request.body.data[eventPayload.entityId],
    eventId: request.body[eventPayload.eventType],
    eventTime: request.body[eventPayload.eventTime],
  };
};

/**
 *return joined query params from request
 * @param {*} request
 * @param queryParamsSeparator
 */
const getQueryStringFrom = (request, queryParamsSeparator = REQ_QUERY_SEPARATOR) => {
  const queryArray = Object.keys(request.query).map((key) => [`${key}:${request.query[key]}`]);
  return queryArray.join(queryParamsSeparator);
};

const getQueryParamsFrom = (req, queryKeys = [], defaultValues = {}) => queryKeys
  .reduce((filter, currentKey) => ({ ...filter, [currentKey]: req.query[currentKey] || defaultValues[currentKey] }), {});

const getPaginationParamsFrom = (req) => getQueryParamsFrom(req, ['sort', 'page', 'size'], { page: pagination.defaults.startPage, size: pagination.defaults.size });

const buildStatusArrayFrom = (statusQueryParam) => statusQueryParam.split(',').map(s => s.trim());

module.exports = {
  buildStatusArrayFrom,
  getUserIdFrom,
  getSalesEventDataFrom,
  getPaginationParamsFrom,
  getQueryParamsFrom,
  getQueryStringFrom,
};
