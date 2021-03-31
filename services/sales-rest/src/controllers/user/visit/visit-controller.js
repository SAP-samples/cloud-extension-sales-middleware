const {
  CREATED, NO_CONTENT, BAD_REQUEST,
} = require('http-status-codes');
const moment = require('moment');
const { isUndefined, isNull } = require('lodash');
const { getQueryParamsFrom, getUserIdFrom, buildStatusArrayFrom } = require('../../../helpers/requests');
const visitValidator = require('../../../validators/visits-validator');
const logger = require('../../../logger/console')("Visit Controller");

const _getFilterParamsFrom = (req) => {
  const { targetDay, status } = getQueryParamsFrom(req, ['targetDay', 'status']);
  const userId = getUserIdFrom(req);
  const date = isUndefined(targetDay) ? moment() : moment.parseZone(targetDay);
  if (status) {
    return { userId, date, statusFilters: buildStatusArrayFrom(status) };
  }
  return { userId, date };
};

const visitControllerFactory = (visitService) => (req, res) =>
  visitService
    .findVisitsBy(_getFilterParamsFrom(req))
    .then(results => res.json({ results }))
    .catch(error => {
      logger.error('Error:', error.message);
      res.status(BAD_REQUEST).json(error.message);
    });

const visitDetailControllerFactory = (visitService) => (req, res) => {
  const { visitId } = req.params;
  return visitValidator
    .validateVisitIdReqParam(visitId)
    .then(() => visitService.findVisitDetails(getUserIdFrom(req), visitId))
    .then(visit => res.json(visit))
    .catch(error => res.json(error.message));
};

const visitStatusUpdateControllerFactory = (visitService) => (req, res) => {
  const { visitId, visitStatus } = req.params;
  return visitService.updateStatusFor(visitId, visitStatus)
    .then(() => res.sendStatus(NO_CONTENT));
};

const visitNoteDeletionControllerFactory = (visitService) => (req, res) => {
  const { visitId } = req.params;
  return visitService.deleteNoteFor(visitId).then(() => res.sendStatus(NO_CONTENT));
};

const visitDraftNoteCreationControllerFactory = (visitService) => (req, res) => {
  const { visitId } = req.params;
  const newDraft = req.body.internalNote;
  if (isUndefined(newDraft) || isNull(newDraft)) {
    return res.status(BAD_REQUEST).send('Expected to receive field internalNote');
  }
  return visitService.addDraft({ visitId, newDraft })
    .then(() => res.sendStatus(CREATED));
};

const visitNoteSyncControllerFactory = (visitService) => (req, res) => {
  const userId = getUserIdFrom(req);
  const completeVisitFlag = req.query.completeVisit === 'true';
  const { visitId } = req.params;
  return visitService.syncAndComplete({ userId, visitId, completeVisitFlag })
    .then(() => res.sendStatus(NO_CONTENT));
};

module.exports = [{
  method: 'GET',
  path: '/visits',
  name: 'visitController',
  handlerFactory: visitControllerFactory,
}, {
  method: 'GET',
  path: '/visits/:visitId',
  name: 'visitDetailController',
  handlerFactory: visitDetailControllerFactory,
}, {
  method: 'POST',
  path: '/visits/:visitId/note',
  name: 'visitDraftNoteCreationController',
  handlerFactory: visitDraftNoteCreationControllerFactory,
}, {
  method: 'DELETE',
  path: '/visits/:visitId/note',
  name: 'visitNoteDeletionController',
  handlerFactory: visitNoteDeletionControllerFactory,
}, {
  method: 'POST',
  path: '/visits/:visitId/status/:visitStatus',
  name: 'visitStatusUpdateControllerFactory',
  handlerFactory: visitStatusUpdateControllerFactory,
}, {
  method: 'POST',
  path: '/visits/:visitId/note/sync',
  name: 'visitNoteSyncControllerFactory',
  handlerFactory: visitNoteSyncControllerFactory,
}];
