const { isEmpty, isUndefined } = require('lodash');
const moment = require('moment');
const { values: { EMPTY_STRING, errorMessages: { dates: { invalidDateFormat }, user: { missingUserId } } }, salesCloud: { credentials, constants: { visitNoteFormatter } } } = require('../../constants/constants');
const { logger, values: { NEW_LINE } } = require('../../constants/constants');
const {
  createAPIClient, buildRequestCredentialsFrom, getResultsFromODataResponse,
} = require('../../helpers/odata');
const { replaceEmptyTagContentWith, decodeHTMLEntities, stripHTML } = require('../../helpers/html-utils');

const visitsApiClient = createAPIClient();

class VisitsAPIClient {
  fetchVisits({ userId, date }) {
    const dateMoment = moment(date);
    if (!dateMoment.isValid()) {
      return Promise.reject(Error(invalidDateFormat(date)));
    }
    if (isUndefined(userId)) {
      return Promise.reject(Error(missingUserId()));
    }
    return this._buildFiltersAndFetchVisits(userId, dateMoment);
  }

  _buildFiltersAndFetchVisits(userId, date) {
    const filterQuery = this._buildVisitsFilters({ userId, date });
    logger.info(`Fetching visits from Sales Cloud with filter=${filterQuery}`);
    return visitsApiClient
      .get(`${credentials.standardBaseURL}/VisitCollection?$filter=${filterQuery}`)
      .then(visitResponse => getResultsFromODataResponse(visitResponse.data))
      .then((visits) => visits.map(this._sanitizeInternalNote));
  }

  fetchVisitByUUID(visitUUID) {
    return visitsApiClient
      .get(`${credentials.standardBaseURL}/VisitCollection('${visitUUID}')`)
      .then(visitResponse => getResultsFromODataResponse(visitResponse.data))
      .then(this._sanitizeInternalNote);
  }

  findVisitParty(visitObjectID) {
    return visitsApiClient
      .get(`${credentials.standardBaseURL}/VisitCollection('${visitObjectID}')/VisitParty`)
      .then(visitResponse => getResultsFromODataResponse(visitResponse.data))
      .catch(err => logger.error(err.message));
  }

  updateStatusFor(visitId, statusCode) {
    return visitsApiClient
      .get(`${credentials.standardBaseURL}/VisitCollection('${visitId}')`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(visitODataResponse => ({
        selectedVisit: getResultsFromODataResponse(visitODataResponse.data),
        headers: buildRequestCredentialsFrom(visitODataResponse),
      }))
      .then(({ selectedVisit, headers }) => {
        const visitToUpdate = selectedVisit;
        visitToUpdate.Status = statusCode;
        return visitsApiClient({
          method: 'put',
          url: `${credentials.standardBaseURL}/VisitCollection('${visitToUpdate.ObjectID}')`,
          headers,
          data: visitToUpdate,
        });
      })
      .catch(err => logger.error(err.message));
  }

  syncAndComplete({ visitId, visitNote, completeVisitFlag }) {
    // when update in Sales Cloud, send complete entity. if field is missing, it will be updated to empty string
    return visitsApiClient
      .get(`${credentials.standardBaseURL}/VisitCollection('${visitId}')`, { headers: { 'x-csrf-token': 'FETCH' } })
      .then(visitODataResponse => ({
        visitData: getResultsFromODataResponse(visitODataResponse.data),
        headers: buildRequestCredentialsFrom(visitODataResponse),
      }))
      .then(({ visitData, headers }) => ({
        visitToUpdate: {
          ...visitData,
          Z_InternalNotesVisit_KUT: visitNote || EMPTY_STRING,
          Status: completeVisitFlag ? '3' : visitData.Status,
        },
        headers,
      }),
      )
      .then(({ visitToUpdate, headers }) => this._updateVisitInSalesCloud({ visitToUpdate, headers }))
      .catch(err => logger.error(err.message));
  }

  _buildVisitsFilters({ userId, date }) {
    const startDate = moment(date).startOf('day').utc().format();
    const endDate = moment(date).endOf('day').utc().format();
    const userFilter = `Owner eq guid'${userId}'`;
    const dateTimeFilter = `(StartDateTime ge datetimeoffset'${startDate}' and StartDateTime le datetimeoffset'${endDate}')`;
    return [userFilter, dateTimeFilter]
      .filter(f => !isEmpty(f))
      .join(' and ');
  }

  _sanitizeInternalNote(visit) {
    const sanitizedInternalNote = decodeHTMLEntities(
      stripHTML(
        replaceEmptyTagContentWith({
          htmlString: visit.Z_InternalNotesVisit_KUT,
          tag: visitNoteFormatter.paragraphTag,
          replaceText: NEW_LINE,
        })));
    return {
      ...visit,
      Z_InternalNotesVisit_KUT: sanitizedInternalNote,
    };
  }

  _updateVisitInSalesCloud({ visitToUpdate, headers }) {
    return visitsApiClient({
      method: 'put',
      url: `${credentials.standardBaseURL}/VisitCollection('${visitToUpdate.ObjectID}')`,
      headers,
      data: visitToUpdate,
    });
  }
}

module.exports = {
  factory: () => new VisitsAPIClient(),
};
