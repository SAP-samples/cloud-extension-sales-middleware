const {
  salesCloud: { credentials, constants: { visitNoteFormatter } },
  values: { NEW_LINE }
} = require('../constants/constants');

const {
  createAPIClient, getResultsFromODataResponse,
} = require('../helpers/odata');

const { replaceEmptyTagContentWith, decodeHTMLEntities, stripHTML } = require('../helpers/html-utils');

const logger = require("../logger/console")("VisitsAPIClient")

const visitsApiClient = createAPIClient();

class VisitsAPIClient {

  fetchVisitByUUID(visitUUID) {
    return visitsApiClient
      .get(`${credentials.visitsBaseURL}/VisitCollection('${visitUUID}')`)
      .then(visitResponse => {
        return getResultsFromODataResponse(visitResponse.data)
        //return visitResponse.data
      })
      //.then(this._sanitizeInternalNote);
  }

  _sanitizeInternalNote(visit) {
      if (visit.Z_InternalNotesVisit_KUT) {
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

    return {
      ...visit,
      Z_InternalNotesVisit_KUT: sanitizedInternalNote,
    };
  }

}

module.exports = {
  factory: () => new VisitsAPIClient(),
};
