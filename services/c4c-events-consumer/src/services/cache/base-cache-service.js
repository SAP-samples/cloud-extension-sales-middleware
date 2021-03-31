const logger = require('../../logger/console')("BaseCacheService");

class BaseCacheService {
  constructor(name, elementHandlers) {
    this.name = name
    this.elementHandlers = elementHandlers
  }

  updateCacheByEventType({ entityId, eventElement, eventType }) {
    logger.info(`Sales Cloud ${this.name}.${eventElement}.${eventType} event received`);
    const handler = this.elementHandlers[eventElement]
    if (!handler) {
      return new Promise(((resolve) => {
        logger.error(`Service ${this.name} has no handler for type: ${eventElement}`);
        resolve(false);
      }));
    }
    return handler()(entityId, eventType);
  }
}

module.exports = { BaseCacheService }
