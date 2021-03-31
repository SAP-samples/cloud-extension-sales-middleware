const { salesCloud: { credentials } } = require('../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse
} = require('../helpers/odata');
const logger = require("../logger/console")("ContactsAPIClient")

const contactsApiClient = createAPIClient();

class ContactsAPIClient {

  findContactByObjectID(contactObjectID) {
    logger.info(`Fetching contact ${contactObjectID} from Sales Cloud`);
    return contactsApiClient
      .get(`${credentials.contactsBaseURL}/ContactCollection('${contactObjectID}')`)
       .then(contactResponse => getResultsFromODataResponse(contactResponse.data));
      // .then(contactResponse => contactResponse.data);
  }

}
module.exports = {
  factory: () => new ContactsAPIClient(),
};
