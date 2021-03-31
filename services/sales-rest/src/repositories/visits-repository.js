/* eslint-disable no-param-reassign */
const { isUndefined, get } = require('lodash');
const moment = require('moment');
const { logger, values: { EMPTY_STRING, SPACE } } = require('../constants/constants');
const { userErrors } = require('../constants/errors');

class VisitsRepository {
  constructor(visitsAPIClient, visitsCacheClient, dbModels) {
    this.dbModels = dbModels;
    this.visitsAPIClient = visitsAPIClient;
    this.visitsCacheClient = visitsCacheClient;
  }

  findVisitsBy({ userId, date }) {
    return this.visitsCacheClient
      .findVisitsBy({ userId, date: moment(date) })
      .then(cachedVisitsResponse => {
        if (cachedVisitsResponse.cacheHit) {
          return cachedVisitsResponse.result;
        }
        return this
          .visitsAPIClient
          .fetchVisits({ userId, date: moment(date) })
          .then(visits => this.visitsCacheClient.cacheVisits({ userId, date: moment(date), visits }));
      });
  }

  findVisitByUUID({ userId, visitUUID }) {
    return this.visitsCacheClient.findVisitById(visitUUID)
      .then((cachedVisit) => {
        if (cachedVisit.cacheHit) {
          return cachedVisit.result;
        }
        return this.visitsAPIClient.fetchVisitByUUID(visitUUID)
          .then(visit => this.visitsCacheClient.cacheVisit(visitUUID, visit))
          .catch(err => {
            logger.error(`Error: ${err.message}`);
            return Promise.reject(err);
          });
      })
      .then(visit => {
        if (visit.Owner !== userId) {
          return Promise.reject(userErrors.VISIT_NOT_FOUND(visitUUID));
        }
        return visit;
      });
  }

  getVisitNoteFor(userId, visitId) {
    return this
      ._getDraftNoteFor(visitId)
      .then(visitDraftNote => {
        if (visitDraftNote && !isUndefined(visitDraftNote.draft)) {
          return this._buildGrACENoteFrom(userId, visitId, visitDraftNote);
        }
        return this
          ._getInternalNoteFor(userId, visitId)
          .then((internalNote) => {
            const appendix = get(visitDraftNote, 'appendix');
            const content = this._buildNoteContentFrom({ appendix, baseContent: internalNote });
            return {
              content,
              hasInternalNote: content.trim() !== EMPTY_STRING,
              isNoteSyncedToACE: isUndefined(appendix),
              updatedAt: get(visitDraftNote, 'updatedAt'),
            };
          });
      });
  }

  appendToDraftNote(visitId, appendix) {
    const { DraftNote } = this.dbModels;
    return DraftNote.findOne({ visitId }, (err, foundDraft) => {
      if (foundDraft === null) {
        return DraftNote.create({
          visitId,
          appendix,
        });
      }
      foundDraft.appendix = [foundDraft.appendix, appendix]
        .filter(content => content !== EMPTY_STRING)
        .join(SPACE);
      return foundDraft.save();
    });
  }

  _buildNoteContentFrom({ baseContent = EMPTY_STRING, appendix = EMPTY_STRING }) {
    return [baseContent, appendix]
      .filter(content => content !== EMPTY_STRING)
      .join(SPACE);
  }

  _getInternalNoteFor(userId, visitUUID) {
    return this
      .findVisitByUUID({ userId, visitUUID })
      .then(visit => visit.Z_InternalNotesVisit_KUT);
  }

  addDraft({ visitId, newDraft }) {
    const { DraftNote } = this.dbModels;
    return DraftNote.findOne({ visitId }, (err, foundDraft) => {
      if (foundDraft === null) {
        logger.info(`Created new draft for visit: ${visitId}`);
        return DraftNote.create({
          visitId,
          draft: newDraft,
        });
      }
      delete foundDraft.appendix; // delete appendix when updating existing draft
      foundDraft.draft = newDraft;
      logger.info(`Updated  draft for visit: ${visitId}`);
      return foundDraft.save();
    });
  }

  deleteNoteFor(visitId) {
    const { DraftNote } = this.dbModels;
    return DraftNote.deleteOne({ visitId });
  }

  syncAndComplete({ userId, visitId, completeVisitFlag }) {
    return this
      .getVisitNoteFor(userId, visitId)
      .then((visitNoteData) => this.visitsAPIClient
        .syncAndComplete({ visitId, visitNote: visitNoteData.content, completeVisitFlag }))
      .then(() => this.visitsAPIClient.fetchVisitByUUID(visitId))
      .then(updatedVisit => this.visitsCacheClient.updateVisitInCache(updatedVisit))
      .then(() => this._deleteDraftBy(visitId));
  }

  updateStatusFor(visitId, statusCode) {
    return this
      .visitsAPIClient
      .updateStatusFor(visitId, statusCode)
      .then(() => this.updateVisitInCache(visitId));
  }

  updateVisitInCache(visitId) {
    return Promise.all([
      this.visitsCacheClient.findVisitById(visitId),
      this.visitsAPIClient.fetchVisitByUUID(visitId)])
      .then(([cachedVisit, salesCloudVisit]) => {
        if (cachedVisit.cacheHit) {
          logger.info(`Updated Visit found in cache: ${visitId}`);
          return this.visitsCacheClient.updateCachedVisit(cachedVisit.result, salesCloudVisit);
        }
        logger.info(`Updated Visit not found in cache: ${visitId}`);
        return this.visitsCacheClient.addNewVisitInCache(salesCloudVisit);
      });
  }

  addVisitInCache(visitUUID) {
    return this
      .visitsAPIClient
      .fetchVisitByUUID(visitUUID)
      .then(visitODataResponse => this.visitsCacheClient.addNewVisitInCache(visitODataResponse));
  }

  findVisitParticipants(visitUUID) {
    // TODO: cache participants
    return this.visitsAPIClient.findVisitParty(visitUUID);
  }

  _deleteDraftBy(visitId) {
    return this.dbModels.DraftNote.deleteOne({ visitId });
  }

  _buildGrACENoteFrom(userId, visitId, draftNote) {
    return {
      content: this._buildNoteContentFrom({
        baseContent: draftNote.draft,
        appendix: draftNote.appendix,
      }),
      hasInternalNote: true,
      isNoteSyncedToACE: false,
      updatedAt: draftNote.updatedAt,
    };
  }

  _getDraftNoteFor(visitId) {
    return this.dbModels.DraftNote.findOne({ visitId });
  }
}

module.exports = {
  factory(visitsAPIClient, visitsCacheClient, models) {
    return new VisitsRepository(visitsAPIClient, visitsCacheClient, models);
  },
};
