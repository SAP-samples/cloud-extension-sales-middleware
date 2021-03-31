const { eventErrors: { EVENT_HANDLER_NOT_IMPLEMENTED, EVENT_TYPE_UNDEFINED } } = require('../constants/errors');
const logger = require('../logger/console')("CloudEventsService");

class CloudEventsService {
  constructor(visitsCacheService, contactsCacheService, accountsCacheService, tasksCacheService, issuesCacheService) {
    this.visitsCacheService = visitsCacheService;
    this.contactsCacheService = contactsCacheService;
    this.accountsCacheService = accountsCacheService;
    this.tasksCacheService = tasksCacheService;
    this.issuesCacheService = issuesCacheService;
    this.eventHandlers = {
      Visit: this.visitsCacheService,
      Contact: this.contactsCacheService,
      Account: this.accountsCacheService,
      ActivityTask: this.tasksCacheService,
      Issue: this.issuesCacheService,
    };
  }

  handleSalesCloudEvent(eventData) {
    return this._updateCacheOnEvent(eventData);
  }

  _updateCacheOnEvent(event) {
    logger.info(`Updating event: ${event}`);
    if (!event.type) {
      return Promise.reject(EVENT_TYPE_UNDEFINED);
    }

    const [group, elem, type] = event.type.split(".")
    const eventHandler = this.eventHandlers[group];
    if (!eventHandler) {
      logger.error(`No handler found for subscribed event: ${event.type}`);
      return Promise.reject(EVENT_HANDLER_NOT_IMPLEMENTED);
    }
    return eventHandler.updateCacheByEventType({
      entityId: event.data["entity-id"],
      eventElement: elem,
      eventType: type,
    });
  }
}
module.exports = {
  factory(visitsCacheService, contactsCacheService, accountsCacheService, tasksCacheService, issuesCacheService) {
    return new CloudEventsService(visitsCacheService, contactsCacheService, accountsCacheService, tasksCacheService, issuesCacheService);
  },
};
