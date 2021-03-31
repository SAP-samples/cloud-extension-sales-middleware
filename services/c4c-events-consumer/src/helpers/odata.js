
const { get, isEmpty } = require('lodash');
const moment = require('moment');
const axios = require('axios');
const { values, salesCloud: { isAuthEnabled, credentials } } = require('../constants/constants');

const createDateFrom = oDataDate => {
  if (isEmpty(oDataDate)) {
    return null;
  }
  return moment(parseInt(oDataDate.replace(/\D/g, values.EMPTY_STRING), 10));
};
const getResultsFromODataResponse = oDataResponse => get(oDataResponse, 'd.results', []);

const getCountFromODataResponse = oDataResponse => oDataResponse.data.d.__count;

const getSkipParameterValue = pagination => pagination.page * pagination.size;

const getTopParameterValue = pagination => pagination.size;

const buildRequestCredentialsFrom = (oDataResponse) => ({
  cookie: oDataResponse.headers['set-cookie'].join('; '),
  'x-csrf-token': oDataResponse.headers['x-csrf-token'],
});

const createAPIClient = () => {
  let conf = {}
  if (isAuthEnabled) {
    conf = {
      auth: { username: credentials.username, password: credentials.password },
      xsrfHeaderName: 'x-csrf-token',
    }
  }
  return axios.create(conf);
}

const getODataIssuesAPIBaseUrl = () => credentials.issueBaseURL;

module.exports = {
  createAPIClient,
  buildRequestCredentialsFrom,
  createDateFrom,
  getResultsFromODataResponse,
  getODataIssuesAPIBaseUrl,
  getCountFromODataResponse,
  getSkipParameterValue,
  getTopParameterValue,
};
