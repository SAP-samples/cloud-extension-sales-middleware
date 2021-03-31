const moment = require('moment');
const ordinal = require('ordinal');
const { computeDurationBetween, buildRelativeStartTimeFrom, buildAbsoluteStartTimeFrom } = require('./time');

const buildCAITextMessage = (content, delay = 0) => ({
  delay,
  content,
  type: 'text',
});

const generateVisitTextFrom = ({ templateString, visitTemplateVariables }) => templateString.formatVisit(visitTemplateVariables);

const buildVisitTemplateVariableFrom = (visitResponse, visitIndex) => ({
  index: ordinal(visitIndex + 1),
  subject: visitResponse.title,
  account: visitResponse.account.name,
  location: visitResponse.location,
  duration: computeDurationBetween(visitResponse.startDate, visitResponse.endDate).humanize(),
  relativeStartTime: buildRelativeStartTimeFrom(visitResponse.endDate),
  absoluteStartTime: buildAbsoluteStartTimeFrom(visitResponse.endDate),
  category: visitResponse.category,
});

const buildVisitDetailsTemplateVariableFrom = visitResponse => ({
  subject: visitResponse.title,
  account: visitResponse.account.name,
  location: visitResponse.location,
  duration: computeDurationBetween(visitResponse.startDate, visitResponse.endDate).humanize(),
  relativeStartTime: buildRelativeStartTimeFrom(visitResponse.endDate),
  absoluteStartTime: buildAbsoluteStartTimeFrom(visitResponse.endDate),
  category: visitResponse.category,
});

const createQueryTimeValue = (queryTime = moment()) => queryTime.format('dddd, MMMM Do YYYY');

module.exports = {
  buildCAITextMessage,
  createQueryTimeValue,
  generateVisitTextFrom,
  buildVisitTemplateVariableFrom,
  buildVisitDetailsTemplateVariableFrom,
};
