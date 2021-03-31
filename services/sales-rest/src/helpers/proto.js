// eslint-disable-next-line
String.prototype.formatVisit = function ({
  queryTime = '',
  count = '',
  index = '',
  subject = '',
  account = '',
  location = '',
  duration = '',
  relativeStartTime = '',
  absoluteStartTime = '',
  category = '',
}) {
  return this
    .replace('[QUERY_TIME]', queryTime)
    .replace('[VISIT_COUNT]', count)
    .replace('[VISIT_INDEX]', index)
    .replace('[VISIT_SUBJECT]', subject)
    .replace('[VISIT_ACCOUNT]', account)
    .replace('[VISIT_LOCATION]', location)
    .replace('[VISIT_DURATION]', duration)
    .replace('[VISIT_START_RELATIVE]', relativeStartTime)
    .replace('[VISIT_START_ABSOLUTE]', absoluteStartTime)
    .replace('[VISIT_CATEGORY]', category);
};

// eslint-disable-next-line
String.prototype.formatVisitDetails = function ({
  subject = '',
  account = '',
  location = '',
  duration = '',
  relativeStartTime = '',
  absoluteStartTime = '',
  category = '',
}) {
  return this.replace('[VISIT_SUBJECT]', subject)
    .replace('[VISIT_ACCOUNT]', account)
    .replace('[VISIT_LOCATION]', location)
    .replace('[VISIT_DURATION]', duration)
    .replace('[VISIT_START_RELATIVE]', relativeStartTime)
    .replace('[VISIT_START_ABSOLUTE]', absoluteStartTime)
    .replace('[VISIT_CATEGORY]', category);
};

// eslint-disable-next-line
String.prototype.formatVisitParticipants = function ({
  selectedVisit = '',
  visitParticipants = '',
}) {
  return this.replace('[SELECTED_VISIT]', selectedVisit)
    .replace('[VISIT_PARTICIPANTS]', visitParticipants);
};

// eslint-disable-next-line
String.prototype.formatVisitInternalNote = function ({
  selectedVisit = '',
}) {
  return this.replace('[SELECTED_VISIT]', selectedVisit);
};
