const { validateSelectedVisitRequirements } = require('../../../validators/cai-validator');
const { getUserIdFrom } = require('../../../helpers/requests');

const buildServiceRequestPayload = (req) => ({
  memory: req.body.conversation.memory,
  language: req.body.conversation.language,
  userId: getUserIdFrom(req),
});

const visitListControllerFactory = caiVisitService => (req, res) => caiVisitService.findVisits(buildServiceRequestPayload(req))
  .then(caiPayload => res.json(caiPayload));

const visitParticipantsControllerFactory = caiVisitService => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.findParticipants(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

const visitDetailsControllerFactory = (caiVisitService) => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.findVisitDetails(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

const visitAddDraftControllerFactory = caiVisitService => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.addDraft(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

const visitSyncAndCompleteControllerFactory = caiVisitService => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.syncAndCompleteVisit(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

const visitNoteControllerFactory = caiVisitService => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.getVisitNote(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

const visitCheckExistingNoteControllerFactory = caiVisitService => (req, res) => validateSelectedVisitRequirements(req)
  .then(() => caiVisitService.checkVisitHasNote(buildServiceRequestPayload(req)))
  .then(caiPayload => res.json(caiPayload));

module.exports = [
  {
    method: 'POST',
    path: '/visits',
    name: 'caiVisitListController',
    handlerFactory: visitListControllerFactory,
  },
  {
    method: 'POST',
    path: '/visits/details',
    name: 'caiVisitDetailsController',
    handlerFactory: visitDetailsControllerFactory,
  },
  {
    method: 'POST',
    path: '/visits/participants',
    name: 'caiVisitParticipantsController',
    handlerFactory: visitParticipantsControllerFactory,
  },
  {
    path: '/visits/add-draft',
    method: 'POST',
    name: 'caiVisitAddDraftController',
    handlerFactory: visitAddDraftControllerFactory,
  },
  {
    path: '/visits/get-note',
    method: 'POST',
    name: 'caiVisitNoteController',
    handlerFactory: visitNoteControllerFactory,
  },
  {
    path: '/visits/check-exists-note',
    method: 'POST',
    name: 'caiVisitCheckExistingNoteController',
    handlerFactory: visitCheckExistingNoteControllerFactory,
  },
  {
    path: '/visits/sync-and-complete',
    method: 'POST',
    name: 'caiVisitSyncAndCompleteController',
    handlerFactory: visitSyncAndCompleteControllerFactory,
  },
];
