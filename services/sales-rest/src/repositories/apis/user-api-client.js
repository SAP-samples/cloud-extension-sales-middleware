const { logger, salesCloud: { credentials } } = require('../../constants/constants');
const { createAPIClient, getResultsFromODataResponse, getODataResponse } = require('../../helpers/odata');
const { uuidToString } = require('../../helpers/converters');

const userApiClient = createAPIClient();

class UserAPIClient {
  findUserById(userUUID) {
    const expandEntities = 'EmployeeBasicData';
    return userApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection('${uuidToString(userUUID)}')?$expand=${expandEntities}`)
      .then(userResponse => getResultsFromODataResponse(userResponse.data))
      .then(user => this._convertUserToDTO(user))
      .catch(err => {
        logger.error(`Error when fetching user by uuid: ${userUUID}`);
        return Promise.reject(err);
      });
  }

  findUserByEmail(userEmail) {
    const expandEntities = 'EmployeeBasicData';
    return userApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection?$filter=EmailURI=${userEmail}$expand=${expandEntities}`)
      .then(userResponse => getResultsFromODataResponse(userResponse.data))
      .then(user => this._convertUserToDTO(user))
      .catch(err => {
        logger.error(`Error when searching user by email: ${userEmail}`);
        return Promise.reject(err);
      });
  }

  findAllUsers(skipToken = '1') {
    const selectFields = 'EmailURI,UserID,EmployeeUUID';
    return userApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection?$select=${selectFields}&$skiptoken=${skipToken}`)
      .then(usersAPIResponse => getResultsFromODataResponse(usersAPIResponse.data))
      .then(usersResponse => ({
        ...usersResponse.reduce((acc, user) => {
          const userEmail = user.EmailURI.toLowerCase() || '';
          if (userEmail) {
            acc[userEmail] = user.EmployeeUUID;
          }
          return acc;
        }, {}),
      }))
      .catch(err => {
        logger.error(`Error fetching users page for skip token: ${skipToken}`);
        return Promise.reject(err);
      });
  }

  countUsers() {
    return userApiClient
      .get(`${credentials.standardBaseURL}/BusinessUserCollection/$count`)
      .then(response => response.data)
      .catch(err => {
        logger.error('Error counting users');
        return Promise.reject(err);
      });
  }

  _convertUserToLiteDTO(userDetails) {
    return { [userDetails.EmailURI]: userDetails.EmployeeUUID };
  }

  _convertUserToDTO(userDetails) {
    return {
      id: userDetails.ObjectID,
      name: userDetails.BusinessPartnerFormattedName,
      companyName: userDetails.CompanyName,
      department: userDetails.DepartmentName,
      email: userDetails.EmailURI,
      jobName: userDetails.EmployeeBasicData.JobName,
      location: userDetails.EmployeeBasicData.FormattedAddress,
      phoneNumber: userDetails.EmployeeBasicData.Mobile || userDetails.EmployeeBasicData.Phone,
    };
  }
}
module.exports = {
  factory: () => new UserAPIClient(),
};
