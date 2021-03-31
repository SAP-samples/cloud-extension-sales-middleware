const { NO_CONTENT } = require('http-status-codes');
const { CloudEvent, HTTP } = require("cloudevents");
const logger = require('../logger/console')("CloudEventsController");

const CloudEventsControllerFactory = (cloudEventsService) => (req, res) => {
  const event = HTTP.toEvent({ headers: req.headers, body: req.body })
  return cloudEventsService
    .handleSalesCloudEvent(event)
    .then(() => {
      if (!event.type || event.type.length == 0) {
        event.type = "c4c-event-consumer"
      }
      if (!event.source || event.source.length == 0) {
        event.source = "c4c-event-consumer-source"
      }
      res.status(200).json(event)
    })
    .catch(err => {
      if (!event.type || event.type.length == 0) {
        event.type = "c4c-event-consumer"
      }
      if (!event.source || event.source.length == 0) {
        event.source = "c4c-event-consumer-source"
      }
      event.error = err
      res.status(415).json(event)
    });
};

module.exports = [{
  method: 'POST',
  path: '',
  name: 'CloudEventsControllerFactory',
  handlerFactory: CloudEventsControllerFactory,
}];
