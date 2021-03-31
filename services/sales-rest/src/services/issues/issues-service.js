const {
  merge, reduce, uniq, isNull, isUndefined, isEmpty,
} = require('lodash');
const { createDateFrom } = require('../../helpers/odata');
const { createPaginationResponse, uuidToString } = require('../../helpers/converters');
const logger = require('../../logger/console')("IssuesService");
const { salesCloud: { constants: { issueStatuses } } } = require('../../constants/constants');

class IssuesService {
  constructor(issuesRepository, accountsService, userService) {
    this.issuesRepository = issuesRepository;
    this.accountsService = accountsService;
    this.userService = userService;
  }

  findIssuesBy({ userId, filterQuery, pagination }) {
    return this
      .issuesRepository
      .findIssuesBy({ userId, filterQuery, pagination })
      .then(issueResponse => this._buildIssueDTOsFor(issueResponse.results)
        .then(results => ({ results, ...createPaginationResponse(issueResponse.paginationData) })));
  }

  findIssueByObjectID({ userId, issueObjectID }) {
    return this
      .issuesRepository
      .findIssueByObjectID({ userId, issueObjectID })
      .then(issue => this
        .accountsService.findAccountByObjectID(issue.SAP_ToAccount)
        .then((issueAccount) => this._buildIssueDTOFrom(issue, issueAccount)));
  }

  findIssueDetails({ userId, issueObjectID }) {
    return this
      .issuesRepository
      .findIssueByObjectID({ userId, issueObjectID })
      .then(issue => Promise.all([
        this._getAccountDetails(issue.SAP_ToAccount),
        this.getIssueProcessorDTO(issue),
      ]).then(([account, processor]) => this._buildIssueDetailsDTO(issue, account, processor)));
  }

  countIssuesByStatusFilters({ userId, filterParams }) {
    return this
      .issuesRepository
      .countIssuesByStatusFilters({ userId, statusFilters: filterParams.statusFilters })
      .then(results => reduce(results, merge, {}));
  }

  _buildIssueDTOsFor(issues) {
    const uniqueAccountUUIDs = uniq(issues.map(issue => issue.SAP_ToAccount))
      .filter(accountUUID => !isNull(accountUUID) && !isUndefined(accountUUID) && !isEmpty(accountUUID));

    return Promise
      .all(uniqueAccountUUIDs.map(accountUUID => this._getAccountDTO(accountUUID)))
      .then(accountDTOs => accountDTOs.reduce((accountDTOMap, currentAccountDTO) => ({ ...accountDTOMap, [currentAccountDTO.id]: currentAccountDTO }), {}))
      .then(accountsMap => issues.map(currentIssue => {
        const accountDTO = accountsMap[uuidToString(currentIssue.SAP_ToAccount)] || null;
        return this._buildIssueDTOFrom(currentIssue, accountDTO);
      }));
  }

  _getAccountDTO(issueAccountUUID) {
    return this
      .accountsService
      .findAccountByObjectID(issueAccountUUID)
      .catch(error => {
        logger.error(`Account ${issueAccountUUID} could not be retrieved: ${error.message}`);
        return null;
      });
  }

  _getAccountDetails(issueAccountUUID) {
    if (!issueAccountUUID) {
      return Promise.resolve(null);
    }
    return this
      .accountsService
      .findAccountDetails(issueAccountUUID)
      .catch(error => {
        logger.error(`Account ${issueAccountUUID} could not be retrieved: ${error.message}`);
        return null;
      });
  }

  _buildIssueTasksDTOs(issue) {
    const issueTasks = issue.IssueTask;
    return issueTasks.map(issueTask => this._buildIssueTaskDTO(issueTask));
  }

  _buildIssueTaskDTO(issueTask) {
    return {
      id: uuidToString(issueTask.SAP_ToActivity),
      title: issueTask.Subject,
    };
  }

  _buildIssueProductsDTO(issue) {
    const issueProducts = issue.IssueItem;
    return issueProducts.map(issueProduct => this._buildIssueProductDTO(issueProduct));
  }

  getIssueProcessorDTO(issue) {
    const issueProcessorUUID = issue.SAP_ToProcessor;
    if (isEmpty(issueProcessorUUID) || isUndefined(issueProcessorUUID)) {
      return null;
    }
    return this.userService.findUserById(issueProcessorUUID);
  }

  _buildIssueProductDTO(issueProduct) {
    return {
      id: issueProduct.ZProductID,
      name: `Product ${issueProduct.ZProductID}`,
      financialSize: {
        value: parseFloat(issueProduct.ZTotalAmount),
        currency: issueProduct.currencyCode,
      },
    };
  }

  _buildIssueDTOFrom(issue, account) {
    return {
      id: issue.ObjectID,
      title: issue.ZDescription,
      type: issue.ZDocTypeDesc,
      status: issueStatuses[issue.ZIssueStatus] || null,
      orderNumber: issue.ZExternalID,
      description: issue.ZDescription,
      creationDate: createDateFrom(issue.CreationDateTime),
      updateDate: createDateFrom(issue.LastChangeDateTime),
      expectedDate: createDateFrom(issue.ZExpectedDate),
      financialSize: {
        value: parseFloat(issue.ZTotalAmount),
        currency: issue.currencyCode,
      },
      account: account || null,
    };
  }

  _buildIssueDetailsDTO(issue, account, processor) {
    return {
      ...this._buildIssueDTOFrom(issue, account),
      resolutionOptions: processor,
      products: this._buildIssueProductsDTO(issue),
      tasks: this._buildIssueTasksDTOs(issue),
    };
  }
}

module.exports = {
  factory: (issuesRepository, accountsService, userService) => new IssuesService(issuesRepository, accountsService, userService),
};
