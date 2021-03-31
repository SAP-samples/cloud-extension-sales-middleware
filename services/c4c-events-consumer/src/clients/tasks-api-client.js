const {
  isEmpty
} = require('lodash');
const { EOL: newline } = require('os');
const {
  createAPIClient, getResultsFromODataResponse
} = require('../helpers/odata');
const {
  values: { EMPTY_STRING },
  salesCloud: { credentials },
} = require('../constants/constants');
const logger = require("../logger/console")("TasksAPIClient")

const tasksApiClient = createAPIClient();

class TasksAPIClient {

  fetchTaskByObjectId(taskObjectID) {
    logger.info(`Fetching task from sales with id: ${taskObjectID}`);
    return tasksApiClient
      .get(`${credentials.tasksBaseURL}/TasksCollection('${taskObjectID}')?$expand=TasksTextCollection`)
        .then(taskResponse => getResultsFromODataResponse(taskResponse.data))
      //.then(taskResponse => taskResponse.data)
      .then(task => this._setDescription(task));
  }

  _setDescription(task) {
    return { ...task, Description: this._getDescriptionFor(task) };
  }

  _getDescriptionFor(task) {
    const taskTexts = "TasksTextCollection";
    if (isEmpty(taskTexts)) {
      return EMPTY_STRING;
    }
    return taskTexts.map(text => text.Text).join(newline);
  }

}

module.exports = {
  factory: () => new TasksAPIClient(),
};
