const moment = require('moment')

const { values: { DEFAULT_USER_ID, REQ_QUERY_SEPARATOR } } = require('../constants/constants')
const { constants: { eventPayload } } = require('../constants/constants')

//const getUserIdFrom = (request) => request.headers.x_mock_user_id || DEFAULT_USER_ID;
// const getUserIdFrom = (req) => {
//   const { $filter: filter } = req._.req.query
//   if (filter) {
//     const RE = /.*Owner eq(?:.*)(?<owner>[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}).*/;
//     const result = RE.exec(filter)
//     if (result && result.length > 1) {
//       return result[1]
//     }
//   }
//   return
// }
const getPaginationFrom = (req) => {
  const { $skip: skip, $top: top } = req._.req.query
  return { top: top, skip: skip}
}

const dateTimeOffsetFrom = (req, field, operation) => {
  const { $filter: filter } = req._.req.query
  if (filter) {
    const RE = new RegExp(`.*${field} ${operation} (datetimeoffset|)\\'(?<starttime>[0-9\\:T+-]{10,})\\'.*`)
    const result = RE.exec(filter)
    if (result && result.length > 1) {
      return moment.parseZone(result[1])
    }
  }
  return moment()
}
const startDateTimeOffsetFrom = (req, field) => dateTimeOffsetFrom(req, field, 'ge')
const endDateTimeOffsetFrom = (req, field) => dateTimeOffsetFrom(req, field, 'le')

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
 */
const getQueryStringFrom = (request, queryParamsSeparator = REQ_QUERY_SEPARATOR) => {
  const queryArray = Object.keys(request.query).map((key) => [`${key}:${request.query[key]}`]);
  return queryArray.join(queryParamsSeparator);
};

const getQueryParamsFrom = (req, queryKeys = [], defaultValues = {}) => queryKeys
  .reduce((filter, currentKey) => ({ ...filter, [currentKey]: req.query[currentKey] || defaultValues[currentKey] }), {});

const buildStatusArrayFrom = (statusQueryParam) => statusQueryParam.split(',').map(s => s.trim());

module.exports = {
  buildStatusArrayFrom,
  getUserIdFrom,
  startDateTimeOffsetFrom,
  endDateTimeOffsetFrom,
  getSalesEventDataFrom,
  getQueryParamsFrom,
  getQueryStringFrom,
  getPaginationFrom,
};
