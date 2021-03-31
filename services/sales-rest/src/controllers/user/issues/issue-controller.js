const {
  buildStatusArrayFrom, getPaginationParamsFrom, getUserIdFrom, getQueryParamsFrom, getQueryStringFrom,
} = require('../../../helpers/requests');
const logger = require('../../../logger/console')("Issue Controller");

const getFilterParamsFrom = (req) => {
  const { account, status } = getQueryParamsFrom(req, ['account', 'status']);
  if (status) {
    return { account, statusFilters: buildStatusArrayFrom(status) };
  }
  return { account };
};

const issuesControllerFactory = (issuesService) => (req, res) =>
  issuesService
    .findIssuesBy({
      userId: getUserIdFrom(req),
      filterQuery: {
        string: getQueryStringFrom(req),
        params: getFilterParamsFrom(req),
      },
      pagination: getPaginationParamsFrom(req),
    })
    .then(issues => res.json(issues));


const issuesCountControllerFactory = (issuesService) => (req, res) =>
  issuesService
    .countIssuesByStatusFilters({
      userId: getUserIdFrom(req),
      filterParams: getFilterParamsFrom(req),
    })
    .then(countResults => res.json(countResults));

const issueControllerFactory = (issuesService) => (req, res) => {
  const { issueObjectID } = req.params;
  return issuesService
    .findIssueDetails({ userId: getUserIdFrom(req), issueObjectID })
    .then(issue => res.json(issue))
    .catch(error => {
      logger.error(`Could not retrieve issue by id in IssuesController: ${error.message}`);
      res.json(error.message);
    });
};

module.exports = [{
  method: 'GET',
  path: '/issues',
  name: 'issuesController',
  handlerFactory: issuesControllerFactory,
},
{
  method: 'GET',
  path: '/issues/count',
  name: 'issuesCountController',
  handlerFactory: issuesCountControllerFactory,
},
{
  method: 'GET',
  path: '/issues/:issueObjectID',
  name: 'issueController',
  handlerFactory: issueControllerFactory,
},
];
