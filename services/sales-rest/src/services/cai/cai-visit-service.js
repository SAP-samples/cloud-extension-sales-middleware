const moment = require('moment');
const { buildCAITextMessage, buildVisitTemplateVariableFrom, buildVisitDetailsTemplateVariableFrom } = require('../../helpers/message');
const logger = require('../../logger/console')("CAIVisitService");
const { extractValuesFromMemory } = require('../../helpers/memory');
const { isValidUTCOffset } = require('../../helpers/time');

class CAIVisitService {
  constructor(visitService) {
    this.visitService = visitService;
  }

  findVisits({ memory, language, userId }) {
    const { visitsDate, timeZone } = extractValuesFromMemory(memory);
    const templates = memory.templates[language];
    const visitTimeQuery = this._getDateWithTimezone(visitsDate, timeZone);
    logger.info(`Displaying CAI visits for date: ${visitTimeQuery}`);
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    return this.visitService.findVisitsBy({ userId, date: visitTimeQuery })
      .then(visits => {
        const visitsTemplateVariables = this._buildVisitsTemplateVariables({ visits, queryTime: visitTimeQuery.format('LL') });
        const visitsTexts = visitsTemplateVariables
          .visits
          .map(visitTemplateVariable => templates.visitSummary.formatVisit(visitTemplateVariable))
          .map(formattedVisitText => buildCAITextMessage(formattedVisitText));
        payload.conversation.memory.displayedVisits = visits.map(visit => visit.id);
        payload.conversation.memory.displayedVisitsLength = visits.length;
        if (visits.length === 1) {
          payload.conversation.memory.selectedVisit = { index: 0 };
        }
        payload.replies.push(this._buildVisitsSummaryMessage(templates, visitsTemplateVariables));
        payload.replies.push(...visitsTexts);
        return payload;
      })
      .catch(error => {
        logger.error(`Error when fetching visits in CAI controller: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  findVisitDetails({ memory, language, userId }) {
    const templates = memory.templates[language];
    const { displayedVisits, selectedVisit } = memory;
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    const visitId = displayedVisits[selectedVisit.index];
    logger.info(`Showing details for visit: ${visitId}`);
    return this.visitService.findVisitDetails(userId, visitId)
      .then(visit => buildVisitDetailsTemplateVariableFrom(visit))
      .then(detailsTemplateVariable => templates.visitDetails.formatVisitDetails(detailsTemplateVariable))
      .then(detailsTextMessage => buildCAITextMessage(detailsTextMessage))
      .then(detailsCaiTextMessage => {
        payload.replies.push(detailsCaiTextMessage);
        return payload;
      })
      .catch(error => {
        logger.error(`Error when fetching visit details from CAI visits service: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  findParticipants({ memory, language, userId }) {
    const { displayedVisits, selectedVisit } = memory;
    const templates = memory.templates[language];
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    return this.visitService.findVisitParty(displayedVisits[selectedVisit.index])
      .then(visitParticipants => this._mapVisitPartyByID(visitParticipants))
      .then(participantsMap => this._buildParticipantsTextMessage({ selectedVisit, templates, participantsMap }))
      .then(participantsTextMessage => {
        payload.replies.push(buildCAITextMessage(participantsTextMessage));
        return payload;
      })
      .catch(error => {
        logger.error(`Error when fetching participants in CAI controller: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  addDraft({ memory, language, userId }) {
    const { displayedVisits, selectedVisit, noteText } = memory;
    const templates = memory.templates[language];
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    const visitId = displayedVisits[selectedVisit.index];
    logger.info(`Add new appendix for visit: ${visitId}`);
    return this.visitService
      .appendToDraftNote(visitId, noteText)
      .then(() => {
        payload.replies.push(buildCAITextMessage(templates.addedInternalNote));
        return payload;
      })
      .catch(error => {
        logger.error(`Could not add appendix in CAI Visit Service: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  getVisitNote({ memory, language, userId }) {
    const { displayedVisits, selectedVisit } = memory;
    const templates = memory.templates[language];
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    const visitObjectID = displayedVisits[selectedVisit.index];
    return this.visitService.getVisitNoteFor(userId, visitObjectID).then(internalNote => {
      if (internalNote) {
        payload.replies.push(buildCAITextMessage(internalNote.content));
      } else {
        const visitNoteVariable = { selectedVisit: selectedVisit.raw };
        const noInternalNoteTextMessage = templates.noInternalNote.formatVisitInternalNote(visitNoteVariable);
        payload.replies.push(buildCAITextMessage(noInternalNoteTextMessage));
      }
      return payload;
    })
      .catch(error => {
        logger.error(error.message);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  syncAndCompleteVisit({ memory, language, userId }) {
    const {
      displayedVisits, selectedVisit, completeVisit,
    } = memory;
    const templates = memory.templates[language];
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    const visitId = displayedVisits[selectedVisit.index];
    return this.visitService
      .syncAndComplete({ userId, visitId, completeVisitFlag: !!completeVisit })
      .then(() => {
        if (completeVisit) {
          payload.replies.push(buildCAITextMessage(templates.successSyncToACE));
        } else {
          payload.replies.push(buildCAITextMessage(templates.successCompleteAndSyncToACE));
        }
        return payload;
      })
      .catch(error => {
        logger.error(`Error when trying to sync visit from CAI visit service: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  checkVisitHasNote({ memory, language, userId }) {
    const { displayedVisits, selectedVisit } = memory;
    const templates = memory.templates[language];
    const payload = {
      replies: [],
      conversation: { memory: { ...memory } },
    };
    const visitId = displayedVisits[selectedVisit.index];
    return this.visitService.getVisitNoteFor(userId, visitId)
      .then(visitNoteData => {
        payload.conversation.memory.existingNote = visitNoteData.hasInternalNote;
        return payload;
      })
      .catch(error => {
        logger.error(`Could not check if visit has note, in CAI Visit Service: ${error.message}`);
        return this._buildCAITextErrorMessage(templates.error);
      });
  }

  _getDateWithTimezone(visitsDate, timeZone) {
    const visitTimeQuery = visitsDate ? moment(visitsDate.iso) : moment();
    if (isValidUTCOffset(timeZone)) {
      visitTimeQuery.utcOffset(timeZone);
    }
    return visitTimeQuery;
  }

  _buildCAITextErrorMessage(errorMessage) {
    return {
      replies: [buildCAITextMessage(errorMessage)],
    };
  }

  _mapVisitPartyByID(visitParticipants) {
    const participantsMap = new Map();
    visitParticipants.forEach(participant => {
      const participantData = participantsMap.get(participant.PartyID);
      if (!participantData) {
        participantsMap.set(participant.PartyID, [participant]);
      } else {
        participantData.push(participant);
      }
    });
    return participantsMap;
  }

  _buildParticipantsTextMessage({ selectedVisit, templates, participantsMap }) {
    if (participantsMap.size === 0) {
      return templates.noParticipants;
    }
    const participantsTextValue = {
      selectedVisit,
      visitParticipants: '',
    };
    participantsMap.forEach(participantRoles => {
      const participantName = participantRoles[0].PartyName;
      const roleText = participantRoles
        .map(role => role.RoleCodeText)
        .join(' and ');
      participantsTextValue.visitParticipants += `${participantName} as ${roleText}\n`;
    });
    return templates.participants.formatVisitParticipants(participantsTextValue);
  }

  _buildVisitsSummaryMessage(templates, visitsTemplateVariables) {
    const visitsCount = visitsTemplateVariables.count;
    if (visitsCount === 0) {
      return buildCAITextMessage(templates.noVisits.formatVisit({
        count: visitsTemplateVariables.count,
        queryTime: visitsTemplateVariables.queryTime,
      }));
    }
    if (visitsCount === 1) {
      return buildCAITextMessage(templates.oneVisit.formatVisit({
        count: visitsTemplateVariables.count,
        queryTime: visitsTemplateVariables.queryTime,
      }));
    }
    return buildCAITextMessage(templates.manyVisits.formatVisit({
      count: visitsTemplateVariables.count,
      queryTime: visitsTemplateVariables.queryTime,
    }));
  }

  _buildVisitsTemplateVariables({ visits, queryTime }) {
    return {
      queryTime,
      count: visits.length,
      visits: visits.map((visit, index) => buildVisitTemplateVariableFrom(visit, index)),
    };
  }
}
module.exports = {
  factory(visitService) {
    return new CAIVisitService(visitService);
  },
};
