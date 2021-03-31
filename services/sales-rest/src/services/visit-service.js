const {
  findKey, uniq, isNull, isUndefined, isEmpty,
} = require('lodash');
const { createDateFrom } = require('./../helpers/odata');
const { greatestDateFrom } = require('../helpers/time');
const {
  salesCloud: { constants: { visitStatuses } },
} = require('../constants/constants');
const filteringService = require('./filtering/generic-filter-service');
const { uuidToString } = require('../helpers/converters');

class VisitService {
  constructor(visitsRepository, contactsService, accountsService) {
    this.visitsRepository = visitsRepository;
    this.contactsService = contactsService;
    this.accountsService = accountsService;
  }

  findVisitsBy({ userId, date, statusFilters }) {
    return this
      .visitsRepository
      .findVisitsBy({ userId, date })
      .then(visits => filteringService.filterByStatus({ items: visits, itemStatuses: visitStatuses, statusFilters }))
      .then(visits => this._fetchVisitDTOsBy(userId, visits));
  }

  findVisitDetails(userId, visitUUID) {
    return this
      .visitsRepository
      .findVisitByUUID({ userId, visitUUID })
      .then(visit => Promise.all([
        this.getVisitNoteFor(userId, visitUUID),
        this.contactsService.findContactByUUID(visit.PrimaryContactUUID),
        this.accountsService.findAccountByObjectID(visit.Account),
      ]).then(([noteData, contact, account]) => this._buildVisitDetailsDTO(visit, account, contact, noteData)));
  }

  findVisitParty(visitUUID) {
    return this.visitsRepository.findVisitParticipants(visitUUID);
  }

  updateStatusFor(visitId, statusText) {
    return this.visitsRepository.updateStatusFor(visitId, findKey(visitStatuses, (status) => status === statusText));
  }

  syncAndComplete({ userId, visitId, completeVisitFlag }) {
    return this.visitsRepository.syncAndComplete({ userId, visitId, completeVisitFlag });
  }

  addDraft({ visitId, newDraft }) {
    return this.visitsRepository.addDraft({ visitId, newDraft });
  }

  getVisitNoteFor(userId, visitId) {
    return this.visitsRepository.getVisitNoteFor(userId, visitId);
  }

  appendToDraftNote(visitId, appendixText) {
    return this.visitsRepository.appendToDraftNote(visitId, appendixText);
  }

  deleteNoteFor(visitId) {
    return this.visitsRepository.deleteNoteFor(visitId);
  }

  _buildVisitDetailsDTO(visit, account, contact, noteData) {
    const visitDTO = this._buildVisitDTOFrom(visit, account, noteData);
    return {
      ...visitDTO,
      primaryContact: {
        id: contact.id,
        name: contact.name,
        isPrimary: true,
        phoneNumber: contact.phoneNumber,
        jobName: contact.jobName,
        location: contact.location,
        department: contact.department,
      },
      updateDate: greatestDateFrom(createDateFrom(visit.EntityLastChangedOn), noteData.updatedAt),
      internalNote: noteData.content,
    };
  }

  _fetchVisitDTOsBy(userId, visits) {
    const uniqueAccountUUIDs = uniq(visits.map(visit => visit.Account))
      .filter(accountUUID => !isNull(accountUUID) && !isUndefined(accountUUID) && !isEmpty(accountUUID));

    return Promise.all(uniqueAccountUUIDs.map(accountUUID =>
      this.accountsService.findAccountByObjectID(accountUUID)))
      .then(accountDTOs => accountDTOs.reduce((accountDTOMap, currentAccountDTO) =>
        ({ ...accountDTOMap, [currentAccountDTO.id]: currentAccountDTO }), {}))
      .then(accountsMap => Promise.all(visits.map(currentVisit => this.getVisitNoteFor(userId, currentVisit.ObjectID)
        .then(noteData => {
          const accountDTO = accountsMap[uuidToString(currentVisit.Account)] || null;
          return this._buildVisitDTOFrom(currentVisit, accountDTO, noteData);
        }))));
  }

  _buildVisitDTOFrom(visit, account, noteData) {
    return {
      id: visit.ObjectID,
      title: visit.Subject,
      status: visitStatuses[visit.Status],
      location: visit.Location,
      category: visit.VisitCategoryText,
      hasInternalNote: noteData.hasInternalNote,
      isNoteSyncedToACE: noteData.isNoteSyncedToACE,
      startDate: createDateFrom(visit.StartDateTime),
      endDate: createDateFrom(visit.EndDateTime),
      account,
    };
  }
}

module.exports = {
  factory(visitsRepository, contactsService, accountsService) {
    return new VisitService(visitsRepository, contactsService, accountsService);
  },
};
