const { toUUID } = require('to-uuid');
const { findKey, isNull, isEmpty } = require('lodash');
const { logger, salesCloud: { credentials, constants: { issueStatuses } } } = require('../../../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse, getTopParameterValue, getSkipParameterValue, getCountFromODataResponse,
} = require('../../../helpers/odata');
const { createPaginationDataFrom } = require('../../../helpers/pagination');

const issuesApiClient = createAPIClient();

class IssuesAPIClient {
  fetchIssues({ userId, filterParams, pagination }) {
    const filterQuery = this._buildIssueFilterQueryFrom(filterParams);
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);
    const orderBy = this._buildOrderByParam(pagination.sort);
    logger.info(`Fetching issues from Sales Cloud for user ${userId}`);

    return issuesApiClient
      .get(`${credentials.issueBaseURL}/IssueRootCollection?$expand=IssueTask,IssueItem&$filter=${filterQuery}&$skip=${skip}&$top=${top}&$orderby=${orderBy}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }

  findIssueByObjectID({ issueObjectID }) {
    const expandEntities = 'IssueItem,IssueTask';
    logger.info(`Fetching issue from Sales Cloud with id: ${issueObjectID}`);
    return issuesApiClient
      .get(`${credentials.issueBaseURL}/IssueRootCollection('${issueObjectID}')?$expand=${expandEntities}`)
      .then(issueResponse => getResultsFromODataResponse(issueResponse.data));
  }

  countIssuesByStatus({ status }) {
    const statusText = status.text;
    logger.info(`Counting issues with status ${statusText} from Sales Cloud`);
    const filterQuery = `$filter=ZIssueStatus eq '${status.code}'`;
    return issuesApiClient
      .get(`${credentials.issueBaseURL}/IssueRootCollection/$count?${filterQuery}`)
      .then(response => ({ [status.text]: response.data }));
  }

  _buildIssueFilterQueryFrom(filterParams) {
    const { account, statusFilters } = filterParams;
    const filters = [];
    if (account) {
      filters.push(this._buildAccountFilter(account));
    }
    if (statusFilters) {
      filters.push(this._buildStatusFilter(statusFilters));
    }
    return filters.join(' and ');
  }

  _buildAccountFilter(account) {
    if (isNull(account) || isEmpty(account) || account === 'null') {
      return 'SAP_ToAccount eq null';
    }
    const accountUUID = toUUID(account);
    return `SAP_ToAccount eq guid'${accountUUID}'`;
  }

  _buildStatusFilter(statusFilters) {
    const statusFiltersQuery = statusFilters.map(statusText => {
      const statusCode = findKey(issueStatuses, (status) => status.toUpperCase() === statusText.toUpperCase());
      return `ZIssueStatus eq '${statusCode}'`;
    });
    return `(${statusFiltersQuery.join(' or ')})`;
  }

  _buildOrderByParam(sort) {
    if (sort === 'account') {
      return 'SAP_ToAccount asc';
    }
    return 'ZExpectedDate desc';
  }
}

module.exports = {
  factory: () => new IssuesAPIClient(),
};
