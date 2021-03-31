const moment = require('moment');

const computeDurationBetween = (startDate, endDate) => moment.duration(startDate.diff(endDate));
const buildRelativeStartTimeFrom = date => date.fromNow();

const buildAbsoluteStartTimeFrom = date => date.format('hA');
const buildFormattedTime = ({ date, format }) => date.format(format);

const isDateValid = date => date !== undefined && moment(date).isValid();

const greatestDateFrom = (...dates) => {
  const moments = dates.filter(date => isDateValid(date)).map(d => moment(d));
  return moment.max(moments);
};
const utcOffsetRegex = new RegExp('^([+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$');

const isValidUTCOffset = (utcOffset) => utcOffsetRegex.test(utcOffset);

module.exports = {
  computeDurationBetween,
  buildRelativeStartTimeFrom,
  buildAbsoluteStartTimeFrom,
  buildFormattedTime,
  greatestDateFrom,
  isDateValid,
  isValidUTCOffset,
};
