
const { get, isEmpty } = require('lodash');
const moment = require('moment');
const axios = require('axios');
const { values, salesCloud: { credentials } } = require('../constants/constants');

const createDateFrom = oDataDate => {
  if (isEmpty(oDataDate)) {
    return null;
  }
  return moment(parseInt(oDataDate.replace(/\D/g, values.EMPTY_STRING), 10));
};
const getResultsFromODataResponse = oDataResponse => get(oDataResponse, 'd.results', []);
const getODataResponse = oDataResponse => get(oDataResponse, 'd', {});

const getCountFromODataResponse = oDataResponse => oDataResponse.data.d.__count;

const getSkipParameterValue = pagination => pagination.page * pagination.size;

const getTopParameterValue = pagination => pagination.size;

const buildRequestCredentialsFrom = (oDataResponse) => ({
  cookie: oDataResponse.headers['set-cookie'].join('; '),
  'x-csrf-token': oDataResponse.headers['x-csrf-token'],
});

const createAPIClient = () => axios.create({
  auth: { username: credentials.username, password: credentials.password },
  xsrfHeaderName: 'x-csrf-token',
});

const getODataIssuesAPIBaseUrl = () => credentials.issueBaseURL;

module.exports = {
  createAPIClient,
  buildRequestCredentialsFrom,
  createDateFrom,
  getResultsFromODataResponse,
  getODataResponse,
  getODataIssuesAPIBaseUrl,
  getCountFromODataResponse,
  getSkipParameterValue,
  getTopParameterValue,
};
